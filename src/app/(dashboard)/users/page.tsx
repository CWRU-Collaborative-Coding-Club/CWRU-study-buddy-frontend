"use client";
import { useAuth } from "@/hooks/useAuth";
import { DecodedToken, User } from "@/models/user";
import {
    addUser,
    deleteAllowedUser,
    deleteUsers,
    listAllowedUsers,
    listAllPendingUsers,
    listUsers,
    updateAccessLevel,
    updateAllowedUserAccessLevel
} from "@/services/user";
import { getCookie } from "@/utils/cookies";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import { jwtDecode } from "jwt-decode";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function UsersPage() {
  const theme = useTheme();

  const [allUsers, setAllUsers] = useState<{
    active: any[];
    deleted: any[];
    pending: any[];
  }>({ active: [], deleted: [], pending: [] });

  // State for user list
  const [rows, setRows] = useState<{
    id: string;
    name: string;
    email: string;
    accessLevel: number;
    status: "active" | "pending" | "deleted";
  }[]>([]);
  
  // State for add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>("User");
  
  // State for edit access level dialog
  const [accessLevelDialogOpen, setAccessLevelDialogOpen] = useState(false);
  const [newAccessLevel, setNewAccessLevel] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState("");
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current user info
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAccessLevel, setCurrentUserAccessLevel] = useState<number | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Use auth hook if available, otherwise use token decoding
  const { accessLevel, userId } = useAuth();

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const [mounted, setMounted] = useState(false);

  const [showInactive, setShowInactive] = useState(false);
  const [userFilter, setUserFilter] = useState("active"); // "active", "pending", "deleted"

  // Cleanup on unmount
  useEffect(() => {
    setMounted(true);
    return () => {
      isMountedRef.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(async (query: string = "", filter: string = userFilter) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    try {
      // Only fetch from API when filter changes or on initial load
      if (!allUsers[filter as keyof typeof allUsers].length || filter !== userFilter) {
        if (filter === "pending") {
          // Get pending users from allowed_users
          const allAllowedUsers = await listAllPendingUsers("");
          if (!isMountedRef.current) return;
          
          // Also fetch active and deleted users if needed
          let activeUsers = allUsers.active;
          let deletedUsers = allUsers.deleted;
          
          if (!activeUsers.length) {
            activeUsers = await listUsers("active", "");
            if (!isMountedRef.current) return;
            setAllUsers(prev => ({ ...prev, active: activeUsers }));
          }
          
          if (!deletedUsers.length) {
            deletedUsers = await listUsers("deleted", "");
            if (!isMountedRef.current) return;
            setAllUsers(prev => ({ ...prev, deleted: deletedUsers }));
          }
          
          // Combine active and deleted users to get all registered emails
          const registeredEmails = new Set([
            ...activeUsers.map((user: User) => user.email.toLowerCase()),
            ...deletedUsers.map((user: User) => user.email.toLowerCase())
          ]);
          
          // Filter out allowed users who already exist in the registered users list
          const pendingUsers = allAllowedUsers.filter(
            (user) => !registeredEmails.has(user.email.toLowerCase())
          );
          
          // Store pending users in state
          if (isMountedRef.current) {
            setAllUsers(prev => ({ ...prev, pending: pendingUsers }));
          
            // Transform for display
            const transformedData = pendingUsers.map((user) => ({
              id: user.email,
              name: 'Pending User',
              email: user.email,
              accessLevel: user.access_level,
              status: "pending" as const
            }));
            
            setRows(transformedData);
          }
        } else {
          const filterType = filter === "deleted" ? "deleted" : "active";
          const response = await listUsers(filterType, "");
          if (!isMountedRef.current) return;
          
          // Store users in state
          if (isMountedRef.current) {
            setAllUsers(prev => ({ ...prev, [filterType]: response }));
          
            // Transform for display
            const transformedData = response.map((user: User) => ({
              id: user.user_id || user.email,
              name: !user.first_name && !user.last_name ? 
                  'User Without Name' : 
                  `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name',
              email: user.email,
              accessLevel: user.access_level,
              status: user.access_level === 0 ? "deleted" as const : "active" as const
            }));
            
            setRows(transformedData);
          }
        }
      } else if (query.trim()) {
        // Client-side searching when we already have the data
        let filteredData = [];
        
        if (filter === "pending") {
          // Filter pending users
          filteredData = allUsers.pending.filter(user => 
            user.email.toLowerCase().includes(query.toLowerCase())
          ).map(user => ({
            id: user.email,
            name: 'Pending User',
            email: user.email,
            accessLevel: user.access_level,
            status: "pending" as const
          }));
        } else {
          // Filter active or deleted users
          const filterType = filter === "deleted" ? "deleted" : "active";
          filteredData = allUsers[filterType].filter((user: User) => {
            const query_lower = query.toLowerCase();
            const email_match = user.email.toLowerCase().includes(query_lower);
            const firstname_match = (user.first_name || '').toLowerCase().includes(query_lower);
            const lastname_match = (user.last_name || '').toLowerCase().includes(query_lower);
            const id_match = user.user_id.toLowerCase().includes(query_lower);
            
            // Create full name for combined search
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim();
            const fullname_match = fullName.includes(query_lower);
            
            return email_match || firstname_match || lastname_match || id_match || fullname_match;
          }).map((user: User) => ({
            id: user.user_id || user.email,
            name: !user.first_name && !user.last_name ? 
                'User Without Name' : 
                `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name',
            email: user.email,
            accessLevel: user.access_level,
            status: user.access_level === 0 ? "deleted" as const : "active" as const
          }));
        }
        
        if (isMountedRef.current) {
          setRows(filteredData);
        }
      } else {
        // No query, show all data for current filter
        let displayData = [];
        
        if (filter === "pending") {
          displayData = allUsers.pending.map(user => ({
            id: user.email,
            name: 'Pending User',
            email: user.email,
            accessLevel: user.access_level,
            status: "pending" as const
          }));
        } else {
          const filterType = filter === "deleted" ? "deleted" : "active";
          displayData = allUsers[filterType].map((user: User) => ({
            id: user.user_id || user.email,
            name: !user.first_name && !user.last_name ? 
                'User Without Name' : 
                `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name',
            email: user.email,
            accessLevel: user.access_level,
            status: user.access_level === 0 ? "deleted" as const : "active" as const
          }));
        }
        
        if (isMountedRef.current) {
          setRows(displayData);
        }
      }
      
      if (isMountedRef.current) {
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (isMountedRef.current) {
        setError("Failed to load users. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userFilter, allUsers]);

  // Fetch user data on component mount
  useEffect(() => {
    // Set current user info from auth hook or token
    if (userId && accessLevel !== null) {
      if (isMountedRef.current) {
        setCurrentUserId(userId);
        setCurrentUserAccessLevel(accessLevel);
      }
    } else {
      const token = getCookie("token");
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          if (isMountedRef.current) {
            setCurrentUserAccessLevel(decoded.access_level);
            setCurrentUserId(decoded.user_id);
          }
        } catch (error) {
          console.error("Invalid token:", error);
          if (isMountedRef.current) {
            setCurrentUserAccessLevel(null);
          }
        }
      }
    }

    fetchUsers();
  }, [userId, accessLevel, fetchUsers]);

  // Email validation
  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Handle email input
  const handleEmailInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.endsWith(",")) {
      const newEmail = value.slice(0, -1).trim();
      if (newEmail && !emails.includes(newEmail) && isValidEmail(newEmail)) {
        setEmails([...emails, newEmail]);
        setEmailInput("");
      } else if (newEmail) {
        setEmailInput(newEmail);
      } else {
        setEmailInput("");
      }
    } else {
      setEmailInput(value);
    }
  };

  // Handle pressing Enter in email field
  const handleEmailKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && emailInput.trim()) {
      const newEmail = emailInput.trim();
      if (!emails.includes(newEmail) && isValidEmail(newEmail)) {
        setEmails([...emails, newEmail]);
        setEmailInput("");
      }
      event.preventDefault();
    }
  };

  // Remove email from list
  const handleDeleteEmail = (emailToDelete: string) => {
    setEmails(emails.filter((email) => email !== emailToDelete));
  };

  // Open add user dialog
  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
    setEmails([]);
    setEmailInput("");
    setSelectedAccessLevel("User");
    setError(null);
  };

  // Close add user dialog
  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };

  // Submit add user form
  const handleAddUsers = async () => {
    // Add current input if valid
    if (emailInput.trim() && isValidEmail(emailInput.trim())) {
      emails.push(emailInput.trim());
      setEmailInput("");
    }

    if (emails.length === 0) {
      setError("Please enter at least one valid email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const access_level =
        selectedAccessLevel === "Admin" ? 9 : selectedAccessLevel === "Manager" ? 5 : 1;

      // Verify user can't create users with higher access level
      if (access_level > (currentUserAccessLevel ?? 0)) {
        setError("You cannot create users with higher access level than your own.");
        setLoading(false);
        return;
      }

      const response = await addUser({
        emails: emails.join(","),
        access_level,
      });

       // Clear the cached pending users data to force a fresh fetch
    setAllUsers(prev => ({ ...prev, pending: [] }));
    
    // Refresh the current view
    await fetchUsers("", userFilter);
    
    // If we're not already on the pending tab, we should refresh that data too
    if (userFilter !== "pending") {
      // Silently refresh pending data in the background
      const allowedResponse = await listAllowedUsers("");
      const activeUsers = allUsers.active.length ? allUsers.active : await listUsers("active", "");
      const deletedUsers = allUsers.deleted.length ? allUsers.deleted : await listUsers("deleted", "");
      
      const registeredEmails = new Set([
        ...activeUsers.map((user: User) => user.email.toLowerCase()),
        ...deletedUsers.map((user: User) => user.email.toLowerCase())
      ]);
      
      const pendingUsers = allowedResponse.allowed_users.filter(
        (user) => !registeredEmails.has(user.email.toLowerCase())
      );
      
      setAllUsers(prev => ({
        ...prev,
        active: activeUsers,
        deleted: deletedUsers,
        pending: pendingUsers
      }));
    }

    handleCloseAddDialog();
  } catch (error: any) {
    setError(error.response?.data?.detail || error.message);
  } finally {
    setLoading(false);
  }
};

  // Delete user
  const handleDeleteUser = async (id: string) => {
    // Don't allow deleting self
    if (id === currentUserId) {
      setError("You cannot delete your own account");
      return;
    }

    const userToDelete = rows.find(row => row.id === id);

    if (!userToDelete) {
      setError("User not found");
      return;
    }
    
    if (userToDelete && userToDelete.accessLevel > (currentUserAccessLevel ?? 0)) {
      setError("You cannot delete users with higher access level than your own");
      return;
    }

  const confirmMessage = userToDelete.status === "pending"
  ? "Are you sure you want to remove this pending user?"
  : "Are you sure you want to delete this user?";
  
if (!window.confirm(confirmMessage)) return;

try {
  setLoading(true);
  
  if (userToDelete.status === "pending") {
    await deleteAllowedUser(userToDelete.email);
    
    setAllUsers(prev => ({
      ...prev,
      pending: prev.pending.filter(user => 
        user.email.toLowerCase() !== userToDelete.email.toLowerCase()
      )
    }));
  } else {
    // For regular users, use the existing deleteUsers function
    await deleteUsers({ user_id: id });
  }
  
  // Update the UI by removing the deleted user
  setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  
  setError(null);
} catch (error: any) {
  console.error("Error deleting user:", error);
  setError(error.response?.data?.detail || "Failed to delete user. Please try again.");
} finally {
  setLoading(false);
}
};
  // Open access level dialog
  const handleOpenAccessLevelDialog = (email: string, currentAccessLevel: number) => {
    setSelectedEmail(email);
    setNewAccessLevel(currentAccessLevel);
    setError(null);
    setAccessLevelDialogOpen(true);
  };

  // Close access level dialog
  const handleCloseAccessLevelDialog = () => {
    setAccessLevelDialogOpen(false);
  };

  // Change user access level
  const handleChangeAccessLevel = async () => {
    const userToUpdate = rows.find(row => row.email === selectedEmail);
    
    // Don't allow changing self
    if (userToUpdate && userToUpdate.id === currentUserId) {
      setError("You cannot change your own access level");
      return;
    }

    // Don't allow setting higher access level than self
    if (newAccessLevel > (currentUserAccessLevel ?? 0)) {
      setError("You cannot set an access level higher than your own");
      return;
    }

    setLoading(true);

    try {
      if (userToUpdate?.status === "pending") {
        // Use the new function for pending users in allowed_users table
        await updateAllowedUserAccessLevel({
          email: selectedEmail,
          new_access_level: newAccessLevel,
        });
        
        // Also update the pending users in state
        setAllUsers(prev => ({
          ...prev,
          pending: prev.pending.map(user => 
            user.email.toLowerCase() === selectedEmail.toLowerCase() 
              ? { ...user, access_level: newAccessLevel }
              : user
          )
        }));
      } else {
        await updateAccessLevel({
          email: selectedEmail,
          new_access_level: newAccessLevel,
        });
      }
  
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.email === selectedEmail
            ? { ...row, accessLevel: newAccessLevel }
            : row
        )
      );
  
      handleCloseAccessLevelDialog();
    } catch (error: any) {
      setError(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchUsers(searchQuery);
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 220 },
    { field: "name", headerName: "Name", width: 180 },
    { field: "email", headerName: "Email", width: 250 },
    { 
      field: "accessLevel", 
      headerName: "Role", 
      width: 150,
      renderCell: (params) => {
        const level = params.value as number;
        const status = params.row.status;
        
        // Define role colors and labels
        const roleConfig = {
          9: { label: "Admin", color: theme.palette.error.main, bgColor: alpha(theme.palette.error.main, 0.1) },
          5: { label: "Manager", color: theme.palette.warning.main, bgColor: alpha(theme.palette.warning.main, 0.1) },
          1: { label: "User", color: theme.palette.primary.main, bgColor: alpha(theme.palette.primary.main, 0.1) },
          0: { label: "Deleted", color: theme.palette.text.disabled, bgColor: alpha(theme.palette.text.disabled, 0.1) }
        };
        
        const config = roleConfig[level as keyof typeof roleConfig] || 
          { label: `${level}`, color: theme.palette.text.primary, bgColor: theme.palette.background.paper };
        
        if (status === "pending") {
          return (
            <Chip 
              label={`Pending ${config.label}`}
              sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                borderColor: theme.palette.info.main,
                fontWeight: 500,
                borderRadius: 1
              }}
              size="small"
              variant="outlined"
            />
          );
        }
        
        if (status === "deleted") {
          return (
            <Chip 
              label="Deleted"
              sx={{ 
                bgcolor: alpha(theme.palette.text.disabled, 0.1),
                color: theme.palette.text.disabled,
                borderColor: theme.palette.text.disabled,
                fontWeight: 500,
                borderRadius: 1
              }}
              size="small"
              variant="outlined"
            />
          );
        }
        
        return (
          <Chip 
            label={config.label}
            sx={{ 
              bgcolor: config.bgColor,
              color: config.color,
              borderColor: config.color,
              fontWeight: 500,
              borderRadius: 1
            }}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => {
        // Don't show edit/delete buttons for current user or higher access level users
        const isCurrentUser = params.row.id === currentUserId;
        const canModify = params.row.accessLevel <= (currentUserAccessLevel ?? 0);
        const isDeleted = params.row.status === "deleted";
        
        if (isCurrentUser) {
          return <Typography variant="caption">(Current User)</Typography>;
        }
        
        if (isDeleted) {
          return canModify ? (
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() =>
                handleOpenAccessLevelDialog(
                  params.row.email,
                  params.row.accessLevel
                )
              }
            />
          ) : (
            <Typography variant="caption">No permission</Typography>
          );
        }
        
        return canModify ? (
          <>
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() =>
                handleOpenAccessLevelDialog(
                  params.row.email,
                  params.row.accessLevel
                )
              }
            />
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => handleDeleteUser(params.row.id)}
            />
          </>
        ) : (
          <Typography variant="caption">No permission</Typography>
        );
      },
    },
  ];

  // If user doesn't have enough access rights
  if (currentUserAccessLevel !== null && currentUserAccessLevel < 5) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You do not have permission to access this page. This page requires Manager or Admin access.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        variant="outlined"
        placeholder="Search users by name, email or ID..."
        value={searchQuery}
        onChange={(e) => {
          const query = e.target.value;
          setSearchQuery(query);
          
          if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
          }
          
          searchTimeout.current = setTimeout(() => {
            setError(null);
            fetchUsers(query);
          }, 300);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ flexGrow: 1 }}
      />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Users
        </Button>
      </Box>

      <div style={{ height: "calc(100vh - 180px)", width: "100%" }}>
      <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
        <ToggleButtonGroup
          value={userFilter}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setUserFilter(newValue);
              fetchUsers(searchQuery, newValue);
            }
          }}
          aria-label="user filter"
          size="small"
        >
          <ToggleButton value="active" aria-label="active users">
            Active
          </ToggleButton>
          <ToggleButton value="pending" aria-label="pending users">
            Pending Signup
          </ToggleButton>
          <ToggleButton value="deleted" aria-label="deleted users">
            Deleted
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {mounted && (
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pagination
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          getRowId={(row) => row.id}
          autoHeight={false}
          disableRowSelectionOnClick
          getRowClassName={(params) => {
            if (params.row.status === "pending") return "pending-row";
            if (params.row.status === "deleted") return "deleted-row";
            return "";
          }}
          sx={{
            '& .pending-row': {
              bgcolor: alpha(theme.palette.info.main, 0.05),
            },
            '& .deleted-row': {
              bgcolor: alpha(theme.palette.text.disabled, 0.05),
              color: theme.palette.text.disabled,
            },
            height: 'calc(100% - 50px)', // Subtract the filter buttons height
            borderRadius: 1
          }}
        />
      )}
      </div>

      {/* Add Users Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Users</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                maxHeight: "200px",
                overflowY: "auto"
              }}
            >
              {emails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleDeleteEmail(email)}
                  color="primary"
                  sx={{ 
                    borderRadius: 1,
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255,255,255,0.7)',
                      '&:hover': { color: 'white' }
                    }
                  }}
                />
              ))}
              <TextField
                variant="standard"
                placeholder={
                  emails.length > 0
                    ? "Add another email..."
                    : "Enter email addresses..."
                }
                value={emailInput}
                onChange={handleEmailInputChange}
                onKeyDown={handleEmailKeyDown}
                sx={{ flexGrow: 1, ml: 1, maxWidth: "200px" }}
                InputProps={{
                  disableUnderline: true,
                }}
              />
            </Paper>
            <Typography variant="caption" color="text.secondary">
              Press comma or Enter after each email to add multiple users
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Role</InputLabel>
              <Select
                value={selectedAccessLevel}
                onChange={(e) => setSelectedAccessLevel(e.target.value as string)}
                label="New Role"
              >
                {/* Only show roles up to the current user's level */}
                {(currentUserAccessLevel ?? 0) >= 9 && (
                  <MenuItem value="Admin">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.error.main,
                          mr: 1 
                        }} 
                      />
                      Admin
                    </Box>
                  </MenuItem>
                )}
                {(currentUserAccessLevel ?? 0) >= 5 && (
                  <MenuItem value="Manager">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.warning.main,
                          mr: 1 
                        }} 
                      />
                      Manager
                    </Box>
                  </MenuItem>
                )}
                <MenuItem value="User">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.primary.main,
                        mr: 1 
                      }} 
                    />
                    User
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            onClick={handleAddUsers} 
            variant="contained"
            color="primary" 
            disabled={loading || emails.length === 0}
            sx={{
              opacity: emails.length === 0 ? 0.7 : 1,
              // Improve disabled state appearance
              '&.Mui-disabled': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                opacity: 0.5,
              }
            }}
          >
            {loading ? "Adding..." : "Add Users"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Access Level Dialog */}
      <Dialog
        open={accessLevelDialogOpen}
        onClose={handleCloseAccessLevelDialog}
      >
        <DialogTitle>Set Access Level</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={selectedEmail}
            disabled
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Access Level</InputLabel>
            <Select
              value={newAccessLevel}
              onChange={(e) => setNewAccessLevel(Number(e.target.value))}
              label="New Access Level"
            >
              {/* Only show levels up to the current user's level */}
              {(currentUserAccessLevel ?? 0) >= 9 && (
                <MenuItem value={9}>Admin</MenuItem>
              )}
              {(currentUserAccessLevel ?? 0) >= 5 && (
                <MenuItem value={5}>Manager</MenuItem>
              )}
              <MenuItem value={1}>User</MenuItem>
              <MenuItem value={0}>Deleted</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccessLevelDialog}>Cancel</Button>
          <Button 
            onClick={handleChangeAccessLevel} 
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? "Setting..." : "Set Access Level"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}