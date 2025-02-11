"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  Typography,
  Grid,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("Refund Request - Angry Customer");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    const userMessage: Message = { sender: "user", text: inputValue, timestamp };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // AI pre-checks message for hints
    const reviewResponse = await fetch("/api/review_message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage.text }),
    });

    const reviewData = await reviewResponse.json();
    setAiHint(reviewData.hint); // Show AI hint before sending

    // Simulate AI Typing Indicator
    setIsTyping(true);

    // Fetch AI response
    const response = await fetch("/api/chat_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMessage.text, scenario: selectedScenario }),
    });

    if (!response.ok) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error: Unable to fetch response.", timestamp }]);
      setIsTyping(false);
      return;
    }

    const data = await response.json();
    const botMessage: Message = { sender: "bot", text: data.reply, timestamp };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500); // Simulate AI response delay
  }

  return (
    <Grid container sx={{ height: "100vh" }}>
      {/* Left Sidebar - Scenarios */}
      <Grid item xs={3} sx={{ bgcolor: "#f4f4f4", p: 2, borderRight: "1px solid #ccc" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Chat Scenarios</Typography>
        <List>
          {["Refund Request - Angry Customer", "Billing Issue - Confused Customer", "Tech Support - Happy Customer"].map((scenario) => (
            <ListItem
              button
              key={scenario}
              onClick={() => setSelectedScenario(scenario)}
              sx={{
                bgcolor: scenario === selectedScenario ? "#0078D4" : "transparent",
                color: scenario === selectedScenario ? "white" : "black",
                borderRadius: "4px",
                mb: 1,
                p: 1,
                "&:hover": { bgcolor: "#0078D4", color: "white" }
              }}
            >
              {scenario}
            </ListItem>
          ))}
        </List>
      </Grid>

      {/* Main Chat Window */}
      <Grid item xs={6} sx={{ p: 2, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Training Chat - {selectedScenario}</Typography>
        <Paper sx={{ flex: 1, overflowY: "auto", p: 2, border: "1px solid #ddd", borderRadius: "8px" }}>
          {messages.map((msg, index) => (
            <Box key={index} sx={{ mb: 1, textAlign: msg.sender === "user" ? "right" : "left" }}>
              <Typography
                sx={{
                  display: "inline-block",
                  p: 1.5,
                  borderRadius: "8px",
                  bgcolor: msg.sender === "user" ? "#0078D4" : "#E5E5E5",
                  color: msg.sender === "user" ? "white" : "black",
                }}
              >
                {msg.text}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "gray" }}>
                {msg.timestamp}
              </Typography>
            </Box>
          ))}
          {isTyping && (
            <Box sx={{ textAlign: "left", mt: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="caption" sx={{ ml: 1 }}>Bot is typing...</Typography>
            </Box>
          )}
        </Paper>

        {/* Message Input */}
        <Box sx={{ display: "flex", mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
          />
          <Button variant="contained" onClick={handleSend} sx={{ ml: 1 }}>
            Send
          </Button>
        </Box>
      </Grid>

      {/* Right Sidebar - AI Feedback */}
      <Grid item xs={3} sx={{ bgcolor: "#f4f4f4", p: 2, borderLeft: "1px solid #ccc" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>AI Feedback</Typography>
        {aiHint && (
          <Paper sx={{ p: 2, bgcolor: "#FFF3CD", borderLeft: "5px solid #FFC107" }}>
            <Typography variant="body1">{aiHint}</Typography>
          </Paper>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1">Live Sentiment Analysis</Typography>
        <Paper sx={{ p: 2, mt: 1, bgcolor: "#E5F6FD", borderLeft: "5px solid #0078D4" }}>
          <Typography variant="body2">Customer Mood: Neutral 😊</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}