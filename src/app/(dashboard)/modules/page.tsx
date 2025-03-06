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
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationModelChange}
        rowCount={rowCount}
        getRowId={(row) => row.agent_id}
        autoHeight={false}
        disableRowSelectionOnClick
        loading={loading}
        pagination
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
  const [searchValue, setSearchValue] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = React.useState(0);
  const [totalModuleCount, setTotalModuleCount] = React.useState(0);

  // Use auth hook instead of manual token decoding
  const { accessLevel, isManager } = useAuth();

  // Fetch modules with pagination and search
  const fetchModules = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await getModules(
        false,
        paginationModel.page + 1, // API uses 1-indexed pages
        paginationModel.pageSize,
        searchValue || undefined
      );
      setRows(response.modules);
      setTotalRows(response.total);
      // Set total module count from the API response
      if ('total_count' in response) {
        setTotalModuleCount(response.total_count);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, searchValue]);

  // Fetch modules when pagination or search changes
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

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
      await editModule(selectedModule.id, {
        title: moduleTitle,
        system_prompt: modulePrompt,
      });

      // Refresh the module list to reflect changes
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
      // Refresh the module list to reflect changes
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

      // Refresh the module list to reflect changes
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
  };

  // Practice module handler
  const handlePracticeModule = (module: Module) => {
    window.location.href = `/chat?moduleTitle=${encodeURIComponent(module.title)}&modulePrompt=${encodeURIComponent(module.system_prompt)}`;
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    { field: "agent_id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Title", width: 200, flex: 1 },
    {
      field: "system_prompt",
      headerName: "System Prompt",
      width: 300,
      flex: 2,
    },
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

  // Debounced search handler
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);
      // Reset to page 0 when searching
      setPaginationModel((prev) => ({
        ...prev,
        page: 0,
      }));
    },
    []
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <TextField
          label="Search modules"
          variant="outlined"
          size="small"
          value={searchValue}
          onChange={handleSearchChange}
          sx={{ width: "300px" }}
          placeholder="Search by title or prompt"
        />
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
          >
            Add Module
          </Button>
        )}
      </Box>
      <Box sx={{ position: 'relative' }}>
        <CustomDataGrid
          rows={rows}
          columns={columns}
          paginationModel={paginationModel}
          rowCount={totalModuleCount}
          loading={loading}
          onPaginationModelChange={handlePaginationModelChange}
        />
      </Box>
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
