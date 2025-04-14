"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { listChats, getChatDetail, updateChatStatus } from "@/services/chat";
import { Chat, Message, ChatVersion } from "@/models/chat";
import { getModuleTitle } from "@/services/module";

export default function ChatHistoryPage() {
  const theme = useTheme();
  const router = useRouter();
  const { userId, accessLevel } = useAuth();

  // State for chat list
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Chat detail view
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // State for module titles
  const [moduleTitles, setModuleTitles] = useState<Record<string, string>>({});

  // Update the fetchChats function with the Users page approach
  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch from server with status filter only, no text search on backend
      const response = await listChats(
        statusFilter !== "all" ? statusFilter : undefined,
        page.toString(),
        pageSize.toString()
      );

      // Filter client-side with search query
      let filteredChats = response.data;
      
      if (searchQuery && searchQuery.trim() !== "") {
        const query_lower = searchQuery.toLowerCase();

        filteredChats = response.data.filter((chat) => {
          // Get title from cache
          const title = moduleTitles[chat.agent_id] || "";

          // Check if either agent_id or title contains the search query
          const matchesAgentId = chat.agent_id
            .toLowerCase()
            .includes(query_lower);
          const matchesTitle = title.toLowerCase().includes(query_lower);

          return matchesAgentId || matchesTitle;
        });
      }

      setChats(filteredChats);
      setTotalPages(Math.ceil(response.total / response.limit));
      setError(null);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError("Failed to load chat history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page, pageSize, moduleTitles]);

  // Fetch module titles in batches
  const fetchModuleTitles = useCallback(async (agentIds: string[]) => {
    if (!agentIds.length) return;

    // Use Promise.all to fetch multiple titles in parallel
    const results = await Promise.all(
      agentIds.map(async (agentId) => {
        try {
          const title = await getModuleTitle(agentId);
          return { agentId, title };
        } catch (error) {
          console.error(`Error fetching title for module ${agentId}:`, error);
          return { agentId, title: `Module ${agentId.slice(0, 8)}...` }; // Fallback
        }
      })
    );

    // Update state with all new titles at once
    setModuleTitles((prev) => {
      const newTitles = { ...prev };
      results.forEach(({ agentId, title }) => {
        newTitles[agentId] = title;
      });
      return newTitles;
    });
  }, []);

  // Load chats when component mounts or filters change
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch module titles when chat list changes
  useEffect(() => {
    if (!loading) {
    const agentIds = chats
      .map((chat) => chat.agent_id)
      .filter((id) => id && !moduleTitles[id]);

    // Get unique agent IDs only
    const uniqueAgentIds = [...new Set(agentIds)];

    if (uniqueAgentIds.length > 0) {
      fetchModuleTitles(uniqueAgentIds);
      }
    }
  }, [chats, fetchModuleTitles, moduleTitles, loading]);

  // Simplified handleSearchChange based on users page
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      // Just trigger a re-fetch with the new search term
      // The fetchChats function will handle the client-side filtering
      setPage(1); // Reset to first page on search
    }, 300);
  };

  // Handle status filter change
  const handleStatusFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string
  ) => {
    if (newValue !== null) {
      setStatusFilter(newValue);
      setPage(1); // Reset to first page on filter change
    }
  };

  // View chat details
  const handleViewChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setLoading(true);
    try {
      setChatDetails(chat.messages);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error("Error fetching chat details:", error);
      setError("Failed to load chat messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Continue chat (navigate to chat page with chat ID)
  const handleContinueChat = (chat: Chat) => {
    // Always continue with the latest version
    router.push(`/chat?moduleId=${chat.agent_id}`);
  };

  // Close chat action
  const handleCloseChat = async (chat: Chat) => {
    try {
      await updateChatStatus({
        chat_id: chat.chat_id,
        status: "closed",
      });
      fetchChats(); // Refresh the list
    } catch (error) {
      console.error("Error closing chat:", error);
      setError("Failed to close chat. Please try again.");
    }
  };

  // Reopen chat action
  const handleReopenChat = async (chat: Chat) => {
    try {
      await updateChatStatus({
        chat_id: chat.chat_id,
        status: "in_progress",
      });
      fetchChats(); // Refresh the list
    } catch (error) {
      console.error("Error reopening chat:", error);
      setError("Failed to reopen chat. Please try again.");
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  // Extract messages from chat details with more robust object access
  const getChatMessages = (): Message[] => {
    return chatDetails || [];
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: "module_id",
      headerName: "Module ID",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" noWrap>
            {params.row.agent_id} {/* Show only the raw agent_id */}
          </Typography>
        </Box>
      ),
    },
    {
      field: "title",
      headerName: "Title",
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" noWrap>
            {moduleTitles[params.row.agent_id] ||
              `Chat ${params.row.chat_id.slice(0, 8)}...`}
          </Typography>
        </Box>
      ),
    },
    {
      field: "startedAt",
      headerName: "Time Started",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(params.row.startedAt)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const status = params.value as string;

        // Status chip styling based on status value
        const statusConfig: Record<
          string,
          { color: string; bgColor: string; label: string }
        > = {
          open: {
            color: theme.palette.success.main,
            bgColor: alpha(theme.palette.success.main, 0.1),
            label: "Open",
          },
          closed: {
            color: theme.palette.text.disabled,
            bgColor: alpha(theme.palette.text.disabled, 0.1),
            label: "Closed",
          },
          in_progress: {
            color: theme.palette.warning.main,
            bgColor: alpha(theme.palette.warning.main, 0.1),
            label: "In Progress",
          },
        };

        const config = statusConfig[status] || {
          color: theme.palette.text.primary,
          bgColor: theme.palette.background.paper,
          label: status,
        };

        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Chip
              label={config.label}
              sx={{
                bgcolor: config.bgColor,
                color: config.color,
                borderColor: config.color,
                fontWeight: 500,
                borderRadius: 1,
              }}
              size="small"
              variant="outlined"
            />
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      renderCell: (params) => {
        const isClosed = params.row.status === "closed";

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: 1,
            }}
          >
            <Button
              startIcon={<VisibilityIcon />}
              variant="outlined"
              size="small"
              onClick={() => handleViewChat(params.row)}
            >
              View
            </Button>
            {isClosed ? (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => handleReopenChat(params.row)}
              >
                Reopen
              </Button>
            ) : (
              <>
                <Button
                  startIcon={<PlayArrowIcon />}
                  variant="contained"
                  size="small"
                  onClick={() => handleContinueChat(params.row)}
                >
                  Continue
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleCloseChat(params.row)}
                >
                  Close
                </Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Search by module ID or title..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
      </Box>

      <div style={{ height: "calc(100vh - 180px)", width: "100%" }}>
        <Box sx={{ display: "flex", mb: 2, gap: 1 }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={handleStatusFilterChange}
            aria-label="chat filter"
            size="small"
          >
            <ToggleButton value="all" aria-label="all chats">
              All
            </ToggleButton>
            <ToggleButton value="open" aria-label="open chats">
              Open
            </ToggleButton>
            <ToggleButton value="in_progress" aria-label="in-progress chats">
              In Progress
            </ToggleButton>
            <ToggleButton value="closed" aria-label="closed chats">
              Closed
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <DataGrid
          rows={chats}
          getRowId={(row) => row.chat_id}
          columns={columns}
          loading={loading}
          pagination
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          autoHeight={false}
          disableRowSelectionOnClick
          getRowClassName={(params) => {
            const status = params.row.status;
            if (status === "closed") return "closed-chat-row";
            if (status === "in_progress") return "in-progress-chat-row";
            if (status === "reopened") return "reopened-chat-row";
            return "";
          }}
          sx={{
            "& .closed-chat-row": {
              bgcolor: alpha(theme.palette.text.disabled, 0.05),
              color: theme.palette.text.disabled,
            },
            "& .in-progress-chat-row": {
              bgcolor: alpha(theme.palette.warning.main, 0.05),
            },
            "& .reopened-chat-row": {
              bgcolor: alpha(theme.palette.info.main, 0.05),
            },
            height: "calc(100% - 50px)", // Subtract the filter buttons height
            borderRadius: 1,
          }}
          onPaginationModelChange={(model) => {
            setPage(model.page + 1); // DataGrid is 0-indexed, our API is 1-indexed
            setPageSize(model.pageSize);
          }}
          rowCount={pageSize * totalPages}
          paginationMode="server"
        />
      </div>

      {/* Chat Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chat Details
          {selectedChat && (
            <Typography variant="subtitle2" color="text.secondary">
              Module:{" "}
              {moduleTitles[selectedChat.agent_id] || selectedChat.agent_id}•
              Started: {formatDate(selectedChat.started_at)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Loading messages...</Typography>
            </Box>
          ) : getChatMessages().length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography>No messages found in this conversation.</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: "500px",
                overflowY: "auto",
                p: 1,
              }}
            >
              {getChatMessages().map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    alignSelf:
                      message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${alpha(
                        message.role === "user"
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                        0.2
                      )}`,
                      bgcolor:
                        message.role === "user"
                          ? alpha(theme.palette.primary.main, 0.05)
                          : alpha(theme.palette.secondary.main, 0.05),
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      {message.role === "user"
                        ? "User"
                        : message.role === "system"
                          ? "System"
                          : "Assistant"}
                    </Typography>
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1, textAlign: "right" }}
                    >
                      {formatDate(message.on)}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedChat && selectedChat.status !== "closed" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                setDetailDialogOpen(false);
                handleContinueChat(selectedChat);
              }}
            >
              Continue Chat
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
