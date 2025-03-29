"use client";

import React, { useState, useEffect } from "react";
import { chat, getChatResponse, getChats, messages } from "./apiService";
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  TextField,
} from "@mui/material";
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
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        py: 2,
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Chat Training
      </Typography>
      <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }}>
        {chats.map((chatItem, index) => (
          <Box
            key={index}
            display="flex"
            justifyContent={
              chatItem.role === "system" ? "flex-start" : "flex-end"
            }
            mb={1}
          >
            <Paper sx={{ p: 2, maxWidth: "60%" }}>
              <Typography variant="body1">{chatItem.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(chatItem.on).toLocaleString()}
              </Typography>
            </Paper>
          </Box>
        ))}
        {isLoading && (
          <Box display="flex" justifyContent="flex-start" mb={1}>
            <Paper
              sx={{
                p: 2,
                maxWidth: "60%",
                display: "flex",
                alignItems: "center",
              }}
            >
              <LoadingDots />
            </Paper>
          </Box>
        )}
      </Box>
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
};

export default ChatTrainingPage;
