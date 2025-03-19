"use client";
import {
  createModule,
  deleteModule,
  editModule,
  getModules,
} from "@/services/module";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import * as React from "react";
import { useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Module } from "../../../models/module";

// DataGrid component
const CustomDataGrid: React.FC<{ rows: Module[]; columns: GridColDef[] }> = ({
  rows,
  columns,
}) => {
  return (
    <div style={{ height: "calc(100vh - 180px)", width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        autoHeight={false}
        disableRowSelectionOnClick
        getRowId={(row) => row.agent_id}
        columnVisibilityModel={{}}
        sx={{ 
          borderRadius: 1,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          }
        }}
      />
    </div>
  );
};

export default function ModulesPage() {
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
  const [selectedPracticeModule, setSelectedPracticeModule] = React.useState<Module | null>(null);

  // Use auth hook instead of manual token decoding
  const { accessLevel, isManager } = useAuth();

  // Function to fetch modules data
  const fetchModules = async () => {
    try {
      const modules = await getModules();
      setRows(modules.modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  // Fetch modules on component mount
  useEffect(() => {
    fetchModules();
  }, []);

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
      minWidth: 220 
    },
    { 
      field: "name", 
      headerName: "Title", 
      flex: 2,
      minWidth: 250 
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
            sx={{ mr: 1, fontSize: '0.8125rem', py: 0.5 }}
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

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flexGrow: 1 }} />
        {isManager() && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            size="small"
            sx={{ fontSize: '0.8125rem', py: 0.5 }}
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
      
      <CustomDataGrid rows={rows} columns={columns} />
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
          <Typography variant="h6" gutterBottom>{selectedPracticeModule?.name}</Typography>
          <Box sx={{ 
            maxHeight: '60vh', 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            p: 2,
            overflowX: 'hidden',
            overflowY: 'auto'
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
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
            onClick={() => {
              window.location.href = `/chat?moduleName=${encodeURIComponent(selectedPracticeModule?.name || '')}&modulePrompt=${encodeURIComponent(selectedPracticeModule?.system_prompt || '')}`;
            }}
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
