"use client";
import * as React from "react";
import { useEffect } from "react";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Button,
  TextField,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  getModules,
  createModule,
  deleteModule,
  editModule,
} from "@/services/module";
import { Module } from "../../../models/module";
import { useAuth } from "../../../hooks/useAuth";

// DataGrid component
const CustomDataGrid: React.FC<{ rows: Module[]; columns: GridColDef[] }> = ({
  rows,
  columns,
}) => {
  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        pageSizeOptions={[5]}
        getRowId={(row) => row.agent_id}
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

  // Use auth hook instead of manual token decoding
  const { accessLevel, isManager } = useAuth();

  // Fetch modules on component mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modules = await getModules();
        console.log(modules);
        setRows(modules.modules);
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };

    fetchModules();
  }, []);

  // Edit module handler
  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setModuleTitle(module.title);
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
      const updatedModule = await editModule(selectedModule.id, {
        title: moduleTitle,
        system_prompt: modulePrompt,
      });

      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === updatedModule.id ? updatedModule : row
        )
      );
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
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
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
      const newModule = await createModule({
        title: moduleTitle,
        system_prompt: modulePrompt,
      });

      setRows((prevRows) => [...prevRows, newModule]);
      handleEditClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Practice module handler
  const handlePracticeModule = (module: Module) => {
    window.location.href = `/chat?moduleTitle=${encodeURIComponent(module.title)}&modulePrompt=${encodeURIComponent(module.system_prompt)}`;
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    { field: "agent_id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Title", width: 150 },
    { field: "system_prompt", headerName: "System Prompt", width: 300 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <>
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={() => handlePracticeModule(params.row)}
          >
            Practice
          </Button>
          {isManager() && (
            <>
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={() => handleEditModule(params.row)}
              />
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={() => handleDeleteModule(params.row.id)}
              />
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Box>
      <CustomDataGrid rows={rows} columns={columns} />
      {isManager() && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => {
            setSelectedModule(null);
            setModuleTitle("");
            setModulePrompt("");
            setEditOpen(true);
          }}
          sx={{ mt: 2 }}
        >
          Add Module
        </Button>
      )}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>
          {selectedModule ? "Edit Module" : "Add Module"}
        </DialogTitle>
        <DialogContent>
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
            rows={4}
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
    </Box>
  );
}
