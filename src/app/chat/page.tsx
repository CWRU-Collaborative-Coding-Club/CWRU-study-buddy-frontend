"use client";

import React, { useState, useEffect } from "react";
import { chat, getChatResponse, getChats, messages } from "./apiService";
import {
  Grid,
  Box,
  Paper,
  Typography,
  IconButton,
  InputBase,
  Divider
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { keyframes } from "@emotion/react";

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
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [chats, setChats] = useState<messages[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleSend = async () => {
    if (newMessage.trim() === "" || !chatId) {
      return;
    }

    const userMessage = {
      role: "user",
      content: newMessage,
      on: new Date(),
    };
    setChats((prevChats) => [...prevChats, userMessage]);
    setIsLoading(true);

    const response: messages = await chat(chatId, newMessage);
    setIsLoading(false);
    if (response) {
      setChats((prevChats) => [...prevChats, response]);
    }
    setNewMessage("");
  };

  return (
    <Grid container spacing={2} sx={{ height: "100vh", p:2 }}>
      { /* Sidebar */}
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
        { /* sidebar content goes here */}
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
            overflow: "hidden"
          }}
        >
          {/* Chat Header */}
          <Box sx={{ 
            p: 2,
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "primary.main",
            color: "white"
          }}>
            <Typography variant="h6">
              Chat Header(Change Later) ({moduleId})
            </Typography>
          </Box>
          
          {/* Messages Area */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              p: 2, 
              overflowY: "auto", 
              mb: 2,
              display: "flex",
              flexDirection: "column"
            }}
          >
            {chats.map((chatItem, index) => (
              <Box
                key={index}
                display="flex"
                flexDirection="column"
                alignItems={chatItem.role === "user" ? "flex-end" : "flex-start"}
                mb={2}
                sx={{
                  maxWidth: "80%",
                  alignSelf: chatItem.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ mb: 0.5, px: 1 }}
                  color="text.secondary"
                >
                  {chatItem.role === "user" ? "You" : 
                   chatItem.role === "system" ? "System" : "Assistant"}
                </Typography>
                  
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: 
                      chatItem.role === "user" ? "primary.main" : 
                      chatItem.role === "system" ? "#f5f5f5" : 
                      "#ffffff",
                    color: chatItem.role === "user" ? "white" : "inherit",
                    borderRadius: 2,
                    width: "auto",
                  }}
                >
                  <Typography variant="body1">{chatItem.content}</Typography>
                  <Typography variant="caption" color={chatItem.role === "user" ? "rgba(255,255,255,0.7)" : "text.secondary"}>
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
              elevation={1}
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
                multiline
                maxRows={4}
              />



              <IconButton 
                color="primary" 
                type="submit"
              >
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
