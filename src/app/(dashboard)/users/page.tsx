"use client";
import * as React from "react";
import { jwtDecode } from "jwt-decode";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Button,
  TextField,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  listUsers,
  addUser,
  deleteUsers,
  updateAccessLevel,
} from "@/services/user";
import { getCookie } from "@/utils/cookies";

interface DecodedToken {
  access_level: number;
}

const CustomDataGrid: React.FC<{ rows: any[]; columns: GridColDef[] }> = ({
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
        getRowId={(row) => row.id}
      />
    </div>
  );
};

export default function UsersPage() {
  const [rows, setRows] = React.useState<
    { id: string; name: string; email: string; accessLevel: number }[]
  >([]);
  const [open, setOpen] = React.useState(false);
  const [emails, setEmails] = React.useState("");
  const [accessLevel, setAccessLevel] = React.useState("User");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [accessLevelDialogOpen, setAccessLevelDialogOpen] =
    React.useState(false);
  const [newAccessLevel, setNewAccessLevel] = React.useState(0);
  const [selectedEmail, setSelectedEmail] = React.useState("");
  const [currentUserAccessLevel, setCurrentUserAccessLevel] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    const token = getCookie("token");
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        setCurrentUserAccessLevel(decodedToken.access_level);
      } catch (error) {
        console.error("Invalid token:", error);
        setCurrentUserAccessLevel(null);
      }
    } else {
      setCurrentUserAccessLevel(null);
    }

    const fetchUsers = async () => {
      try {
        const response = await listUsers("all", "", 1, 10);

        const data = response;
        const transformedData = data.map(
          (user: {
            user_id: string;
            first_name: string;
            last_name: string;
            email: string;
            access_level: number;
          }) => ({
            id: user.user_id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            accessLevel: user.access_level,
          })
        );

        setRows(transformedData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleClickOpen = () => {
    setEmails(""); // Clear the emails input
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const access_level =
        accessLevel === "Admin" ? 9 : accessLevel === "Manager" ? 5 : 1;

      const response = await addUser({
        emails: emails,
        access_level: access_level,
      });

      alert(response.message);

      // Refresh user list
      const usersResponse = await listUsers();
      const usersData = usersResponse;

      const transformedData = usersData.map(
        (user: {
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          access_level: number;
        }) => ({
          id: user.user_id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          accessLevel: user.access_level,
        })
      );

      setRows(transformedData);
      setOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUsers({ user_id: id });

      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
      alert("User deleted successfully");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  const handleOpenAccessLevelDialog = (
    email: string,
    currentAccessLevel: number
  ) => {
    setSelectedEmail(email);
    setNewAccessLevel(currentAccessLevel);
    setAccessLevelDialogOpen(true);
  };

  const handleCloseAccessLevelDialog = () => {
    setAccessLevelDialogOpen(false);
    setSelectedEmail("");
    setNewAccessLevel(0);
  };

  const handleChangeAccessLevel = async () => {
    if (newAccessLevel > (currentUserAccessLevel ?? 0)) {
      setError("You cannot set an access level higher than your own.");
      return;
    }

    try {
      setLoading(true);
      const response = await updateAccessLevel({
        email: selectedEmail,
        new_access_level: newAccessLevel,
      });

      alert(response.message);

      // Update the user's access level in the state
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

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "accessLevel", headerName: "Access Level", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
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
            onClick={() => handleDeleteUser(params.id.toString())}
          />
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <CustomDataGrid rows={rows} columns={columns} />
      <TextField
        variant="outlined"
        placeholder="Search by email"
        sx={{ width: 300, marginTop: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        sx={{ marginTop: 2, width: 300 }}
      >
        Search
      </Button>
      <Button
        variant="contained"
        color="secondary"
        sx={{ marginTop: 2, width: 300 }}
        onClick={handleClickOpen}
      >
        Add User
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Users</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Emails"
            type="email"
            fullWidth
            variant="outlined"
            placeholder="Enter multiple emails separated by commas"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Access Level</InputLabel>
            <Select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              label="Access Level"
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
              <MenuItem value="User">User</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddUsers} disabled={loading}>
            {loading ? "Adding..." : "Add Users"}
          </Button>
        </DialogActions>
        {error && (
          <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}
      </Dialog>
      <Dialog
        open={accessLevelDialogOpen}
        onClose={handleCloseAccessLevelDialog}
      >
        <DialogTitle>Set Access Level</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
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
              {[...Array(10).keys()].map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccessLevelDialog}>Cancel</Button>
          <Button onClick={handleChangeAccessLevel} disabled={loading}>
            {loading ? "Setting..." : "Set Access Level"}
          </Button>
        </DialogActions>
        {error && (
          <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}
      </Dialog>
    </Box>
  );
}
