"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  chat,
  getChatResponse,
  ExtendedChatResponse,
  getChats,
  messages,
  pdfDocument,
  getPDfDocuments,
  download_pdf,
  getModuleTitle,
  getCriteria,
  getCriteriaResponse,
} from "./apiService";
import {
  Grid,
  Box,
  Paper,
  Typography,
  IconButton,
  InputBase,
  Divider,
  Icon,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { keyframes } from "@emotion/react";
import DownloadIcon from "@mui/icons-material/Download";
import { updateChatStatus } from "@/services/chat";
import { useRouter } from "next/navigation";

const loadingAnimation = keyframes`
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const LoadingDots = () => (
  <Box display="flex">
    <Box
      component="span"
      sx={{
        fontSize: "2rem",
        mr: "2px",
        animation: `${loadingAnimation} 1.4s infinite`,
        animationDelay: "0s",
      }}
    >
      .
    </Box>
    <Box
      component="span"
      sx={{
        fontSize: "2rem",
        mr: "2px",
        animation: `${loadingAnimation} 1.4s infinite`,
        animationDelay: "0.2s",
      }}
    >
      .
    </Box>
    <Box
      component="span"
      sx={{
        fontSize: "2rem",
        animation: `${loadingAnimation} 1.4s infinite`,
        animationDelay: "0.4s",
      }}
    >
      .
    </Box>
  </Box>
);

const ChatTrainingPage = () => {
  const router = useRouter();
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [chats, setChats] = useState<messages[]>([]);
  const [moduleCriteria, setModuleCriteria] = useState<
    Record<string, boolean[]>
  >({});
  const [chatId, setChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(searchParams.entries());
    if (params.moduleId) {
      setModuleId(params.moduleId as string);
    }
  }, []);

  useEffect(() => {
    async function fetchChats() {
      if (moduleId) {
        try {
          const response: getChatResponse = await getChats(moduleId);
          if (response) {
            setChats(response.messages);
            setChatId(response.chat_id);
          }
        } catch (error) {
          console.error("Error fetching chats:", error);
        }
      }
    }
    fetchChats();
  }, [moduleId]);

  const fetchCriteria = useCallback(async () => {
    if (moduleId) {
      try {
        const response = (await getCriteria(
          moduleId
        )) as unknown as getCriteriaResponse;
        if (response && response.criteria) {
          const criteria: Record<string, boolean[]> = {};
          for (const [key, value] of Object.entries(response.criteria)) {
            criteria[key] = value;
          }
          setModuleCriteria(criteria);
        }
      } catch (error) {
        console.error("Error fetching criteria:", error);
      }
    }
  }, [moduleId]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const [moduleTitle, setModuleTitle] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModuleTitle() {
      if (moduleId) {
        try {
          const title = await getModuleTitle(moduleId);
          setModuleTitle(title);
        } catch (error) {
          console.error("Error fetching module title:", error);
        }
      }
    }
    fetchModuleTitle();
  }, [moduleId]);

  const handleSend = async () => {
    if (newMessage.trim() === "" || !chatId) {
      return;
    }

    const userMessage = {
      role: "user",
      content: newMessage,
      on: new Date(),
    };

    setNewMessage("");

    setChats((prevChats) => [...prevChats, userMessage]);
    setIsLoading(true);

    const response: messages = await chat(chatId, newMessage);
    setIsLoading(false);

    if (response) {
      setChats((prevChats) => [...prevChats, response]);

      setTimeout(() => {
        fetchCriteria();
      }, 5000);
    }
  };

  const handleCloseChat = async () => {
    if (!chatId) return;
    
    try {
      await updateChatStatus({
        chat_id: chatId,
        status: "closed",
      });
      // Redirect to chat history page
      router.push('/chatHistory');
    } catch (error) {
      console.error("Error closing chat:", error);
      // You could add error handling here, like showing a notification
    }
  };

  // Add this after the handleCloseChat function
  const handleBack = () => {
    // Simply navigate back to chat history without changing chat status
    router.push('/chatHistory');
  };

  const calculateCriteriaPercentage = () => {
    const allCriteria = Object.values(moduleCriteria).flat(); // Flatten all criteria arrays
    const totalCriteria = allCriteria.length;
    const trueCriteria = allCriteria.filter((criterion) => criterion).length;
  
    return totalCriteria > 0 ? Math.round((trueCriteria / totalCriteria) * 100) : 0;
  };

  // Add a scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add a useEffect that triggers scrolling when chats or isLoading change
  useEffect(() => {
    scrollToBottom();
  }, [chats, isLoading]);

  return (
    <Grid container spacing={2} sx={{ height: "100vh", p: 2 }}>
      {/* Sidebar */}
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
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Sidebar Content
          </Typography>
          {/* sidebar content goes here */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Reference Documents
            </Typography>
            <Box display="flex" alignItems="center">
              <IconButton
                color="primary"
                onClick={() => moduleId && download_pdf(moduleId)}
                disabled={!moduleId}
                size="small"
              >
                <DownloadIcon />
              </IconButton>
              <Typography variant="body2" sx={{ ml: 1 }}>
                Download Reference PDF
              </Typography>
            </Box>
          </Box>

          {/* New Criteria Section */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              User Criteria
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" component="div">
                <ul style={{ paddingLeft: "16px", margin: "8px 0" }}>
                  {moduleCriteria &&
                    Object.keys(moduleCriteria).length > 0 &&
                    Object.entries(moduleCriteria).map(([key, values]) => (
                      <li key={key}>
                        <Typography variant="body2">
                          <strong>{key}:</strong>{" "}
                          {<span>{values ? "True" : "False"}</span>}
                        </Typography>
                      </li>
                    ))}
                </ul>
              </Typography>
            </Box>
          </Box>
          {/* Existing Sidebar Content */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Criteria Progress
            </Typography>
            <Typography
              variant="h4" // Make the percentage larger
              sx={{
                fontWeight: "bold", // Make it bold
                color: (theme) => {
                  const percentage = calculateCriteriaPercentage();
                  if (percentage < 50) return theme.palette.error.main; // Red for <50%
                  if (percentage < 80) return theme.palette.warning.main; // Yellow for 50%-79%
                  return theme.palette.success.main; // Green for 80%-100%
                },
              }}
            >
              {calculateCriteriaPercentage()}%
            </Typography>
          </Box>
           {/* Logo at the Bottom */}
          <Box
            sx={{
              mt: "auto", // Push the logo to the bottom
              textAlign: "center",
              pt: 2,
            }}
          >
            <img
              src="/eaton-logo-mobile.png"
              alt="Eaton logo"
              width={300}
            />
          </Box>
        </Paper>
      </Grid>
     
      {/* Main Chat Area */}
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
            <Typography variant="h6">
              {moduleTitle || "Chat Session"}
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ 
                  color: "white", 
                  borderColor: "white",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)"
                  } 
                }}
              >
                Back
              </Button>
              <Button 
                variant="contained"
                color="error"
                startIcon={<CloseIcon />}
                onClick={handleCloseChat}
                sx={{ color: "white" }}
              >
                Close Chat
              </Button>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: "auto",
              mb: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {chats.map((chatItem, index) => (
              <Box
                key={index}
                display="flex"
                flexDirection="column"
                alignItems={
                  chatItem.role === "user" ? "flex-end" : "flex-start"
                }
                mb={2}
                sx={{
                  maxWidth: "80%",
                  alignSelf:
                    chatItem.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ mb: 0.5, px: 1 }}
                  color="text.secondary"
                >
                  {chatItem.role === "user"
                    ? "You"
                    : chatItem.role === "system"
                      ? "System"
                      : "Assistant"}
                </Typography>

                <Paper
                  elevation={0.1}
                  sx={{
                    p: 2,
                    backgroundColor:
                      chatItem.role === "user"
                        ? "primary.main"
                        : chatItem.role === "system"
                          ? "#f5f5f5"
                          : "#ffffff",
                    color: chatItem.role === "user" ? "white" : "inherit",
                    borderRadius: 2,
                    width: "auto",
                  }}
                >
                  <Typography variant="body1">{chatItem.content}</Typography>
                  <Typography
                    variant="caption"
                    color={
                      chatItem.role === "user"
                        ? "rgba(255,255,255,0.7)"
                        : "text.secondary"
                    }
                  >
                    {new Date(chatItem.on).toLocaleString()}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <Box
                display="flex"
                justifyContent="flex-start"
                mb={1}
                sx={{ alignSelf: "flex-start" }}
              >
                <Paper
                  elevation={0.1}
                  sx={{
                    p: 2,
                    maxWidth: "100%",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 2,
                  }}
                >
                  <LoadingDots />
                </Paper>
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
              component="form"
              elevation={0.1}
              sx={{
                p: "2px 4px",
                display: "flex",
                alignItems: "center",
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                multiline
                maxRows={4}
              />

              <IconButton color="primary" type="submit">
                <SendIcon />
              </IconButton>
            </Paper>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
  /* 
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        py: 2,
      }}
    >


      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        sx={{ display: "flex", gap: 2 }}
      >

        <TextField
          variant="outlined"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          fullWidth
        />

        <Button variant="contained" color="primary" type="submit">
          Send
        </Button>

      </Box>
    </Container>
  );
*/
};

export default ChatTrainingPage;
