"use client";
import {
  createChatAPI,
  createModule,
  deleteModule,
  deleteModuleResource,
  editModule,
  getModules,
  getModuleResources,
} from "@/services/module";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from '@mui/icons-material/Close';
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
  IconButton,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import * as React from "react";
import { useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Module, CreateModuleRequest, EditModuleRequest } from "../../../models/module";
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

  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = React.useState("");
  const [isSaved, setIsSaved] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });
  const [totalModuleCount, setTotalModuleCount] = React.useState(0);
  const [criteria, setCriteria] = React.useState<string[]>([""]);  // Initialize with one empty criterion
  const [existingPdfName, setExistingPdfName] = React.useState<string | null>(null);
  const [pdfResourceId, setPdfResourceId] = React.useState<string | null>(null);

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
  const handleEditModule = async (module: Module) => {
    setSelectedModule(module);
    setModuleTitle(module.name);
    setModulePrompt(module.system_prompt);
    
    // Make sure criteria is properly initialized when editing
    if (module.criteria && module.criteria.length > 0) {
      setCriteria(module.criteria);
    } else {
      // If no criteria exists, initialize with one empty criterion
      setCriteria([""]);
    }
    
    // Check if module has a PDF file attached and set the resource ID if available
    if (module.has_pdf) {
      try {
        // Fetch the module resources to get the actual PDF filename
        const resourcesData = await getModuleResources(module.agent_id);

        // Find any resources with original_filename
        const pdfResource = resourcesData.resources.find(r => r.original_filename);
                
        if (pdfResource) {
          setPdfResourceId(pdfResource.resource_id);
          setExistingPdfName(pdfResource.original_filename);
        } else {
          setExistingPdfName("PDF Attached"); // Fallback if we can't get the filename
        }
      } catch (error) {
        console.error("Error fetching PDF filename:", error);
        setExistingPdfName("PDF Attached"); // Fallback if API call fails
      }
    } else {
      setExistingPdfName(null);
      setPdfResourceId(null);
    }
    
    setEditOpen(true);

    if(!isSaved) {
      setPdfFile(null);     
      setPdfFileName(""); 
      resetFileInput();
    }

    setIsSaved(false);
  };

  // Save button handler
  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Perform save logic (e.g., update or create module)
      if (selectedModule) {
        await handleUpdateModule();
      } else {
        await handleAddModule();
      }

      // Mark the module as saved
      setIsSaved(true);

      // Close the dialog
      handleEditClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  // Dialog close handler
  const handleEditClose = () => {
    setEditOpen(false);
    setPdfFile(null);
    setPdfFileName("");
  };

  const handleRemoveFile = () => {
    setPdfFile(null); 
    setPdfFileName("");
    resetFileInput();
  }

  const resetFileInput = () => {
    const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Update module handler
  const handleUpdateModule = async () => {
    if (!selectedModule) return;
    if (!moduleTitle || !modulePrompt) return;

    // Filter out empty criteria
    const filteredCriteria = criteria.filter(c => c.trim() !== "");
    
    // Ensure at least one criterion exists
    if (filteredCriteria.length === 0) {
      setError("At least one non-empty criterion is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we need to delete the PDF
      if (pdfFileName === "REMOVE_PDF" && selectedModule && pdfResourceId) {
        try {
          await deleteModuleResource(selectedModule.agent_id, pdfResourceId);
        } catch (error: any) {
          setError(`Failed to remove PDF: ${error.message}`);
          setLoading(false);
          return;
        }
      }
      
      const basicData: EditModuleRequest = {
        title: moduleTitle,
        system_prompt: modulePrompt,
        criteria: filteredCriteria,
        // If we've explicitly marked to remove the PDF
        keep_existing_pdf: existingPdfName !== null && pdfFileName !== "REMOVE_PDF"
      };
      
      // Single request to update module with optional PDF
      await editModule(selectedModule.agent_id, basicData, pdfFile || undefined);
      
      // Refresh data from server
      await fetchModules();
      handleEditClose();
      // Reset PDF state
      setPdfFile(null);
      setPdfFileName("");
      setExistingPdfName(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add module handler
  const handleAddModule = async () => {
    if (!moduleTitle || !modulePrompt) {
      setError("Title and system prompt are required");
      return;
    }

    // Filter out empty criteria
    const filteredCriteria = criteria.filter(c => c.trim() !== "");
    
    // Ensure at least one criterion exists
    if (filteredCriteria.length === 0) {
      setError("At least one non-empty criterion is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Single request to create module with optional PDF
      const newModule = await createModule({
        title: moduleTitle,
        system_prompt: modulePrompt,
        criteria: filteredCriteria,
      }, pdfFile || undefined);
      
      // Refresh data from server
      await fetchModules();
      handleEditClose();
      // Reset PDF state
      setPdfFile(null);
      setPdfFileName("");
    } catch (error: any) {
      setError(error.message);
      console.error("Detailed error:", error);
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

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Please upload only PDF files');
        return;
      }
      
      // Validate file size (optional, example limit: 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB');
        return;
      }

      setPdfFile(file);
      setPdfFileName(file.name);
      setError(null);
    }
  };

  // Add a new criterion at a specific index
  const handleAddCriterion = (index: number) => {
    const updatedCriteria = [...criteria];
    updatedCriteria.splice(index + 1, 0, ""); // Insert a new empty criterion after the current index
    setCriteria(updatedCriteria);
    
    // Schedule scrolling after the component renders with the new criterion
    setTimeout(() => {
      const criteriaContainer = document.getElementById('criteria-container');
      const newCriterionElement = document.getElementById(`criterion-${index + 1}`);
      
      if (criteriaContainer && newCriterionElement) {
        criteriaContainer.scrollTo({
          top: newCriterionElement.offsetTop,
          behavior: 'smooth'
        });
      }
    }, 100); // Small delay to ensure the DOM has updated
  };

  // Remove a criterion at a specific index
  const handleRemoveCriterion = (index: number) => {
    if (criteria.length > 1) {
      const updatedCriteria = [...criteria];
      updatedCriteria.splice(index, 1); // Remove the criterion at the specified index
      setCriteria(updatedCriteria);
    }
  };

  // Update a specific criterion
  const handleCriterionChange = (index: number, value: string) => {
    const updatedCriteria = [...criteria];
    updatedCriteria[index] = value;
    setCriteria(updatedCriteria);
  };

  // Reset criteria to default when opening new module dialog
  const handleOpenAddModule = () => {
    setSelectedModule(null);
    setModuleTitle("");
    setModulePrompt("");
    // Initialize with one empty criterion
    setCriteria([""]);
    setEditOpen(true);
    setPdfFile(null);     
    setPdfFileName(""); 
    resetFileInput();
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
            onClick={handleOpenAddModule}
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
          
          {/* PDF File Upload Section */}
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              accept=".pdf"
              style={{ display: 'none' }}
              id="pdf-file-input"
              type="file"
              onChange={handlePdfFileChange}
            />
            <label htmlFor="pdf-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFileIcon />}
              >
                Upload PDF
              </Button>
            </label>
            {/* Show existing PDF if one exists and no new one is selected */}
            {existingPdfName && !pdfFile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {existingPdfName}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => {
                    // Just mark for deletion - don't actually delete yet
                    setExistingPdfName(null);
                    setPdfFileName("REMOVE_PDF");
                  }}
                  aria-label="remove existing pdf"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            {/* Show newly selected PDF */}
            {pdfFile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Selected: {pdfFile.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleRemoveFile}
                  aria-label="remove pdf"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          
          {/* Criteria Section - Enhanced with proper styling */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Criteria
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please add at least one criterion for evaluation.
            </Typography>
            <Box 
              id="criteria-container" 
              sx={{ 
                maxHeight: '200px', 
                overflowY: 'auto', 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                p: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#bdbdbd',
                  borderRadius: '4px',
                },
              }}
            >
              {criteria.map((criterion, index) => (
                <Box 
                  key={index}
                  id={`criterion-${index}`}
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    mb: 1.5,
                    '&:last-child': {
                      mb: 0.5
                    }
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={criterion}
                    onChange={(e) => handleCriterionChange(index, e.target.value)}
                    placeholder={`Criterion ${index + 1}`}
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleAddCriterion(index)}
                    sx={{ mr: 0.5 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveCriterion(index)}
                    disabled={criteria.length === 1} // Disable remove if there's only one criterion
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>

          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
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