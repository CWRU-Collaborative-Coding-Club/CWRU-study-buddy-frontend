"use client";
import {
  createChatAPI,
  createModule,
  deleteModule,
  editModule,
  getModules,
} from "@/services/module";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import * as React from "react";
import { useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Module } from "../../../models/module";
import { useRouter } from "next/navigation";

// DataGrid component
const CustomDataGrid: React.FC<{
  rows: Module[];
  columns: GridColDef[];
  paginationModel: {
    page: number;
    pageSize: number;
  };
  rowCount: number;
  loading: boolean;
  onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
}> = ({
  rows,
  columns,
  paginationModel,
  rowCount,
  loading,
  onPaginationModelChange,
}) => {
  return (
    <div style={{ height: "calc(100vh - 180px)", width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationModelChange}
        rowCount={rowCount || rows.length} // Fallback to rows.length if rowCount is 0
        getRowId={(row) => row.agent_id}
        autoHeight={false}
        disableRowSelectionOnClick
        loading={loading}
        pagination
        sx={{
          borderRadius: 1,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-footerContainer": {
            display: "flex",
            justifyContent: "flex-end",
          },
        }}
      />
    </div>
  );
};

export default function ModulesPage() {
  const router = useRouter();
  // State
  const [rows, setRows] = React.useState<Module[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedModule, setSelectedModule] = React.useState<Module | null>(
    null
  );
  const [moduleTitle, setModuleTitle] = React.useState("");
  const [modulePrompt, setModulePrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = React.useState(false);
  const [selectedPracticeModule, setSelectedPracticeModule] =
    React.useState<Module | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });
  const [totalModuleCount, setTotalModuleCount] = React.useState(0);

  // Use auth hook instead of manual token decoding
  const { accessLevel, isManager } = useAuth();

  // Fetch modules with pagination and search
  const fetchModules = React.useCallback(async () => {
    try {
      setLoading(true);

      // Try to get modules with pagination
      let response;
      try {
        response = await getModules(
          false,
          paginationModel.page + 1, // API uses 1-indexed pages
          paginationModel.pageSize,
          searchValue || undefined
        );
      } catch (apiError) {
        // If it fails, try without pagination as fallback
        response = await getModules();
      }

      // Check if we have a valid response
      if (response && response.modules) {
        setRows(response.modules);

        // Use total for rowCount in DataGrid pagination
        if (typeof response.total === "number") {
          setTotalModuleCount(response.total);
        } else if (typeof response.total_count === "number") {
          setTotalModuleCount(response.total_count);
        } else {
          // If no total provided, use the length of modules array
          setTotalModuleCount(response.modules.length);
        }
      } else {
        // Fallback to empty array if no valid response
        setRows([]);
        setTotalModuleCount(0);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      // Reset to empty state on error
      setRows([]);
      setTotalModuleCount(0);
    }
  }, [paginationModel.page, paginationModel.pageSize, searchValue]);

  // Fetch modules when pagination or search changes
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Edit module handler
  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setModuleTitle(module.name);
    setModulePrompt(module.system_prompt);
    setEditOpen(true);
  };

  // Dialog close handler
  const handleEditClose = () => {
    setEditOpen(false);
  };

  // Update module handler
  const handleUpdateModule = async () => {
    if (!selectedModule) return;

    setLoading(true);
    setError(null);

    try {
      await editModule(selectedModule.agent_id, {
        title: moduleTitle,
        system_prompt: modulePrompt,
      });

      // Refresh data from server
      await fetchModules();
      handleEditClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete module handler
  const handleDeleteModule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    setLoading(true);
    setError(null);

    try {
      await deleteModule(id);
      // Refresh data from server
      await fetchModules();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add module handler
  const handleAddModule = async () => {
    setLoading(true);
    setError(null);

    try {
      await createModule({
        title: moduleTitle,
        system_prompt: modulePrompt,
      });

      // Refresh data from server
      await fetchModules();
      handleEditClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePaginationModelChange = (newModel: {
    page: number;
    pageSize: number;
  }) => {
    setPaginationModel(newModel);

    // We don't need to manually call fetchModules here because
    // it will be triggered by the dependency in useEffect
  };

  // Input change handler (immediate update for typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchValue(inputValue);
      // Reset to page 0 when searching
      setPaginationModel((prev) => ({
        ...prev,
        page: 0,
      }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Practice module handler
  const handlePracticeModule = (module: Module) => {
    setSelectedPracticeModule(module);
    setPracticeOpen(true);
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: "agent_id",
      headerName: "ID",
      flex: 1,
      minWidth: 220,
    },
    {
      field: "name",
      headerName: "Title",
      flex: 2,
      minWidth: 250,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <>
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={() => handlePracticeModule(params.row)}
            variant="contained"
            color="primary"
            size="small"
            sx={{ mr: 1, fontSize: "0.8125rem", py: 0.5 }}
          >
            Practice
          </Button>
          {isManager() && (
            <>
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={() => handleEditModule(params.row)}
                sx={{ mr: 1 }}
              />
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={() => handleDeleteModule(params.row.agent_id)}
              />
            </>
          )}
        </>
      ),
    },
  ];

  function createChat(selectedPracticeModule: Module | null) {
    return async () => {
      if (!selectedPracticeModule) return;

      setLoading(true);
      setError(null);

      try {
        var response = await createChatAPI({
          agent_id: selectedPracticeModule.agent_id,
        });
        if (response && response.chat_id) {
          router.push(`/chat?moduleId=${selectedPracticeModule.agent_id}`);
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  }

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
          placeholder="Search modules by title..."
          value={inputValue}
          onChange={handleInputChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        {isManager() && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedModule(null);
              setModuleTitle("");
              setModulePrompt("");
              setEditOpen(true);
            }}
          >
            Add Module
          </Button>
        )}
      </Box>

      <Box sx={{ position: "relative", flexGrow: 1 }}>
        <CustomDataGrid
          rows={rows}
          columns={columns}
          paginationModel={paginationModel}
          rowCount={totalModuleCount}
          loading={loading}
          onPaginationModelChange={handlePaginationModelChange}
        />
      </Box>

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedModule ? "Edit Module" : "Add Module"}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="System Prompt"
            type="text"
            fullWidth
            multiline
            rows={8}
            value={modulePrompt}
            onChange={(e) => setModulePrompt(e.target.value)}
          />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={selectedModule ? handleUpdateModule : handleAddModule}
            color="primary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={practiceOpen}
        onClose={() => setPracticeOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Practice Module</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              width: "100%",
              maxWidth: "100%",
              whiteSpace: "normal",
            }}
          >
            {selectedPracticeModule?.name}
          </Typography>
          <Box
            sx={{
              maxHeight: "60vh",
              overflow: "auto",
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              p: 2,
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {selectedPracticeModule?.system_prompt}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPracticeOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={createChat(selectedPracticeModule as Module | null)}
            variant="contained"
            color="primary"
          >
            Go to Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
