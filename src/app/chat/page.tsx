"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputBase,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  Typography,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Link,
  Snackbar,
  Alert,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Import API service
import { ApiService } from "./apiService";

// Import ChatSession types
import { ChatSession, ChatMessage, ChatVersion } from "./apiService";

// Define message types
type Role = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  attachments?: string[];
  feedback?: {
    score: number;
    comment?: string;
  };
}

interface ScenarioContext {
  title: string;
  description: string;
  guidelines: string[];
  keyTerms: { [key: string]: string };
}

interface TrainingResource {
  id: string;
  title: string;
  url: string;
}

const ChatTrainingPage = () => {
  // Get params and user info
  const params = useParams();
  const searchParams = useSearchParams();
  const currentUser = ApiService.getCurrentUser();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  // Reference for typing indicator to fix inconsistent ID issue
  const typingIndicatorId = useRef(`typing-indicator-${Date.now()}`).current;

  // Get module ID from URL params or search params, with fallback
  const [moduleId, setModuleId] = useState(() => {
    return (
      params?.moduleId?.toString() ||
      searchParams?.get("moduleId") ||
      "module-123" // Default fallback
    );
  });

  const [userId, setUserId] = useState<string>(
    currentUser?.id || "anonymous-user"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [progressTracked, setProgressTracked] = useState(false);
  const [moduleTitle, setModuleTitle] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scenario context state
  const [scenarioContext, setScenarioContext] = useState<ScenarioContext>({
    title: "",
    description: "",
    guidelines: [],
    keyTerms: {},
  });

  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sessionVersion, setSessionVersion] = useState<number>(1);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with module data
  useEffect(() => {
    // Reset progress tracking flag when module changes
    setProgressTracked(false);

    // Fix memory leak with isMounted flag
    let isMounted = true;

    const initializeChat = async () => {
      try {
        if (isMounted) setIsLoading(true);

        // Use currentUser directly instead of fetching again
        if (currentUser && isMounted) {
          setUserId(currentUser.id);
        }

        // Fetch module details from backend - pass userId for personalization
        const moduleData = await ApiService.fetchModuleById(moduleId, userId);
        if (isMounted) setModuleTitle(moduleData.title);

        // Update scenario context
        if (isMounted) setScenarioContext(moduleData.scenario_context);

        // Fetch training resources - pass userId for personalization
        const resourcesData = await ApiService.fetchTrainingResources(
          moduleId,
          userId
        );
        if (isMounted) setResources(resourcesData);

        // Try to get existing chat session or create a new one
        try {
          const session = await ApiService.getChatSession(moduleId, userId);
          if (isMounted) {
            setChatSession(session);
            setChatId(session.chat_id);
            setSessionVersion(session.version);

            // If there are existing messages in the chat session, load them
            if (
              session.chat[session.version] &&
              session.chat[session.version].messages.length > 0
            ) {
              // Map messages from the chat session to the format used in the UI
              const sessionMessages = session.chat[
                session.version
              ].messages.map((msg, index) => ({
                id: `${msg.role}-${index}`,
                role: msg.role as Role,
                content: msg.content,
                timestamp: new Date(msg.on),
              }));

              setMessages(sessionMessages);
              setIsLoading(false);
              return; // Exit early since we have loaded the session
            }
          }
        } catch (err) {
          if (isMounted)
            console.warn("No existing chat session found, starting a new one");
        }

        // If no existing session or messages, continue with standard initialization
        // Create a new chat session
        const newChatId = await ApiService.createChatSession(moduleId);
        if (!isMounted) return; // Prevent state updates if unmounted

        setChatId(newChatId);

        // Initialize with system message
        const initialMessages = [
          {
            id: "system-1",
            role: "system" as Role,
            content: moduleData.system_prompt,
            timestamp: new Date(),
          },
          {
            id: "assistant-1",
            role: "assistant" as Role,
            content:
              "Hello! I'm your virtual customer for today's training. I recently received my invoice and I'm confused about a $45 charge labeled 'Service Fee'. I don't remember agreeing to this. Can you help me understand what this is for?",
            timestamp: new Date(),
          },
        ];

        if (isMounted) {
          setMessages(initialMessages);
        }

        // Create initial chat session structure
        const session: ChatSession = {
          agent_id: moduleId,
          user_id: userId,
          version: 1,
          chat_id: newChatId,
          chat: {
            "1": {
              score: 0,
              progress: 0,
              status: "open",
              started_at: new Date().toISOString(),
              messages: initialMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                on: msg.timestamp.toISOString(),
              })),
            },
          },
        };

        setChatSession(session);
        setSessionVersion(1);
        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          console.error("Error initializing chat:", err);
          setError("Failed to load training module. Please try again.");
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [moduleId, userId, currentUser]); // Added currentUser to dependency array

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleOpenResources = () => {
    setResourcesOpen(true);
  };

  const handleCloseResources = () => {
    setResourcesOpen(false);
  };

  // Centralized function to update the chat session
  const updateChatSession = (userMessage: string, aiResponse: any) => {
    if (!chatSession) return null;

    const updatedSession = { ...chatSession };
    const currentVersion = updatedSession.chat[sessionVersion];

    // Push both messages to the session
    currentVersion.messages.push({
      role: "user",
      content: userMessage,
      on: new Date().toISOString(),
    });

    currentVersion.messages.push({
      role: "assistant",
      content: aiResponse.content,
      on: aiResponse.on,
    });

    // Increment progress
    const messageCount = currentVersion.messages.filter(
      (m) => m.role === "user"
    ).length;
    const estimatedProgress = Math.min(
      Math.floor((messageCount / 10) * 100),
      100
    );
    currentVersion.progress = estimatedProgress;

    // Update status to in_progress
    currentVersion.status = "in_progress";

    return updatedSession;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!chatId) {
      setError("Chat session not initialized properly. Please refresh.");
      return;
    }

    try {
      // Add user message to chat UI
      const userMessageId = `user-${Date.now()}`;
      const newUserMessage: Message = {
        id: userMessageId,
        role: "user",
        content: inputMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newUserMessage]);
      setInputMessage("");
      setIsTyping(true);

      // Add typing indicator with consistent ID
      const typingMessage: Message = {
        id: typingIndicatorId,
        role: "assistant",
        content: "...",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, typingMessage]);

      // Send message to backend
      const response = await ApiService.sendMessage(inputMessage, chatId);

      // Remove typing indicator first
      setMessages((prev) => prev.filter((msg) => msg.id !== typingIndicatorId));

      // Add AI response to chat
      const assistantMessageId = `assistant-${Date.now()}`;
      const aiResponse: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: response.data.content,
        timestamp: new Date(response.data.on),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);

      // Track progress if this is the first message from the user
      if (userId !== "anonymous-user" && !progressTracked) {
        try {
          // Using a default score of 5 since API doesn't provide scores
          const score = 5;
          await ApiService.trackProgress(
            userId,
            moduleId,
            chatId, // Confirmed this is correct from API
            score
          );
          setProgressTracked(true);
        } catch (err) {
          console.error("Failed to track progress:", err);
          // Non-critical error, don't show to user
        }
      }

      // Update session data using centralized function
      if (chatSession) {
        const updatedSession = updateChatSession(inputMessage, {
          content: response.data.content,
          on: response.data.on,
        });

        if (updatedSession) setChatSession(updatedSession);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      setIsTyping(false);

      // Remove the typing indicator message with consistent ID
      setMessages((prev) => prev.filter((msg) => msg.id !== typingIndicatorId));
    }
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  // Session recovery mechanism
  const recoverSession = async () => {
    try {
      setIsLoading(true);
      const session = await ApiService.getChatSession(moduleId, userId);

      setChatSession(session);
      setChatId(session.chat_id);
      setSessionVersion(session.version);

      // Reload messages
      if (session.chat[session.version]?.messages.length > 0) {
        const sessionMessages = session.chat[session.version].messages.map(
          (msg, index) => ({
            id: `${msg.role}-${index}`,
            role: msg.role as Role,
            content: msg.content,
            timestamp: new Date(msg.on),
          })
        );

        setMessages(sessionMessages);
      }

      setIsLoading(false);
      setSuccessMessage("Session recovered successfully");
    } catch (err) {
      console.error("Failed to recover session:", err);
      setError("Could not recover session. Starting a new one.");

      // Try to create a new session as fallback
      try {
        const newChatId = await ApiService.createChatSession(moduleId);
        setChatId(newChatId);
        setIsLoading(false);
      } catch (createErr) {
        setError("Failed to create new session. Please refresh the page.");
        setIsLoading(false);
      }
    }
  };

  // Complete chat session function
  const completeChatSession = async () => {
    if (!chatSession) {
      setError("No active chat session to complete");
      return;
    }

    try {
      // Calculate average score (dummy score since API doesn't provide real scores)
      // In a real implementation, we'd use actual scores
      const score = 8; // Default good score

      // Mark the session as completed
      const completedSession = await ApiService.completeChatSession(
        moduleId,
        userId,
        sessionVersion,
        score
      );

      setChatSession(completedSession);

      // Show completion message (using success message instead of error)
      setSuccessMessage("Training session completed successfully!");
    } catch (err) {
      console.error("Failed to complete chat session:", err);
      setError("Failed to complete training session");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading training module...
        </Typography>
      </Box>
    );
  }

  // User avatar or placeholder based on whether we have user data
  const userAvatar = currentUser ? (
    <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
      {`${currentUser.first_name?.[0] || ""}${currentUser.last_name?.[0] || ""}`}
    </Avatar>
  ) : (
    <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
      {"U"}
    </Avatar>
  );

  return (
    <Grid container spacing={2} sx={{ height: "100vh", p: 2 }}>
      {/* Error notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success notification */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Resources Dialog */}
      <Dialog
        open={resourcesOpen}
        onClose={handleCloseResources}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Training Resources
          <IconButton
            aria-label="close"
            onClick={handleCloseResources}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {resources.map((resource) => (
              <ListItem
                key={resource.id}
                sx={{ borderBottom: "1px solid #eee" }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  {resource.url.endsWith(".pdf") ? (
                    <PictureAsPdfIcon color="error" sx={{ mr: 2 }} />
                  ) : (
                    <DescriptionIcon color="primary" sx={{ mr: 2 }} />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Link href={resource.url} target="_blank" underline="hover">
                      {resource.title}
                    </Link>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Scenario Context Sidebar */}
      <Grid item xs={12} md={3} sx={{ height: "100%" }}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            height: "calc(100vh - 32px)",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* User info section - shows who is doing the training */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              pb: 2,
              borderBottom: "1px solid #eee",
            }}
          >
            {userAvatar}
            <Box sx={{ ml: 1 }}>
              <Typography variant="subtitle2">
                {currentUser
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : "Guest User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Chat ID:{" "}
                {chatId ? chatId.substring(0, 8) + "..." : "Initializing..."}
              </Typography>
            </Box>
          </Box>

          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Training Scenario
          </Typography>

          <Typography variant="h6" color="primary" mt={2}>
            {scenarioContext.title}
          </Typography>

          <Typography variant="body1" paragraph mt={1}>
            {scenarioContext.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="bold">
            Guidelines:
          </Typography>
          <List dense>
            {scenarioContext.guidelines.map((guideline, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <Typography variant="body2">• {guideline}</Typography>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="bold">
            Key Terms:
          </Typography>
          {Object.entries(scenarioContext.keyTerms).map(
            ([term, definition], index) => (
              <Box key={index} mt={1}>
                <Typography variant="body2" fontWeight="medium">
                  {term}
                </Typography>
                <Typography variant="body2" color="text.secondary" pl={2}>
                  {definition}
                </Typography>
              </Box>
            )
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArticleIcon />}
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleOpenResources}
          >
            View Training Resources
          </Button>

          {/* Show training progress button if we have a valid user */}
          {userId !== "anonymous-user" && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AssessmentIcon />}
              fullWidth
              sx={{ mt: 1 }}
              // This would navigate to a progress page or open a progress modal
              onClick={() =>
                console.log("View progress - would open progress modal")
              }
            >
              View Your Progress
            </Button>
          )}
          {/* Add a session recovery button */}
          <Button
            variant="outlined"
            color="warning"
            fullWidth
            sx={{ mt: 1 }}
            onClick={recoverSession}
          >
            Recover Session
          </Button>
        </Paper>
      </Grid>

      {/* Chat Area */}
      <Grid item xs={12} md={9} sx={{ height: "100%" }}>
        <Paper
          elevation={3}
          sx={{
            p: 0,
            height: "calc(100vh - 32px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #e0e0e0",
              backgroundColor: "primary.main",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6">Customer Service Training</Typography>
              <Typography variant="body2">
                Practice handling customer inquiries professionally
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {/* Module info badge - now shows title */}
              <Chip
                label={`Module: ${moduleTitle || moduleId}`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: "medium",
                }}
              />

              {/* Session status */}
              {chatSession && (
                <Chip
                  label={`Status: ${chatSession.chat[sessionVersion]?.status || "initializing"}`}
                  size="small"
                  color={
                    chatSession.chat[sessionVersion]?.status === "completed"
                      ? "success"
                      : chatSession.chat[sessionVersion]?.status ===
                          "in_progress"
                        ? "primary"
                        : "default"
                  }
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
              )}

              {/* Progress indicator */}
              {chatSession &&
                chatSession.chat[sessionVersion]?.progress > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <CircularProgress
                      variant="determinate"
                      value={chatSession.chat[sessionVersion]?.progress || 0}
                      size={24}
                      thickness={6}
                      sx={{ mr: 1, color: "white" }}
                    />
                    <Typography variant="caption" color="white">
                      {chatSession.chat[sessionVersion]?.progress || 0}%
                    </Typography>
                  </Box>
                )}

              {/* Complete session button */}
              {chatSession &&
                chatSession.chat[sessionVersion]?.status !== "completed" && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={completeChatSession}
                    sx={{
                      ml: 2,
                      bgcolor: "rgba(255,255,255,0.2)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                    }}
                  >
                    Complete Session
                  </Button>
                )}
            </Box>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    message.role === "user" ? "flex-end" : "flex-start",
                  mb: 2,
                  maxWidth: "80%",
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {message.role !== "system" && (
                  <Typography
                    variant="caption"
                    sx={{ mb: 0.5, px: 1 }}
                    color="text.secondary"
                  >
                    {message.role === "user" ? "You" : "Virtual Customer"}
                  </Typography>
                )}

                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor:
                      message.role === "user"
                        ? "primary.light"
                        : message.role === "system"
                          ? "#f5f5f5"
                          : "#ffffff",
                    color: message.role === "user" ? "white" : "inherit",
                    borderRadius: 2,
                    width: message.role === "system" ? "100%" : "auto",
                  }}
                >
                  {message.role === "system" ? (
                    <Typography variant="subtitle2" fontWeight="bold">
                      {message.content}
                    </Typography>
                  ) : (
                    <Typography variant="body1">{message.content}</Typography>
                  )}
                </Paper>

                {/* Feedback chip for user messages */}
                {message.role === "user" && message.feedback && (
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <Chip
                      label={`Score: ${message.feedback.score}/10`}
                      color={
                        message.feedback.score >= 7 ? "success" : "warning"
                      }
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                    {message.feedback.comment && (
                      <Typography
                        variant="caption"
                        sx={{ maxWidth: "80%", textAlign: "right" }}
                      >
                        {message.feedback.comment}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <Box sx={{ display: "flex", alignItems: "center", ml: 1, mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Virtual customer is typing...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#f9f9f9",
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: "2px 4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Type your response..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
              />

              <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />

              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
              >
                <SendIcon />
              </IconButton>
            </Paper>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ChatTrainingPage;
