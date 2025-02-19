"use client";
import * as React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowId } from '@mui/x-data-grid';
import { Button, TextField, Box, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, FormControl, InputLabel, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const initialRows = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', accessLevel: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', accessLevel: 'User' },
  { id: 3, name: 'Alice Johnson', email: 'alice.johnson@example.com', accessLevel: 'User' },
  // Add more user data as needed
];

const CustomDataGrid: React.FC<{ rows: any[]; columns: GridColDef[] }> = ({ rows, columns }) => {
  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} pagination pageSizeOptions={[5]} />
    </div>
  );
};

export default function UsersPage() {
  const [open, setOpen] = React.useState(false);
  const [emails, setEmails] = React.useState('');
  const [accessLevel, setAccessLevel] = React.useState('User');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState(initialRows);

  const handleDeleteUser = (id: number) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'accessLevel', headerName: 'Access Level', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteUser(params.id as number)}
        />
      ),
    },
  ];

  const handleClickOpen = () => {
    setEmails(''); // Clear the emails input
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails, accessLevel }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invites');
      }

      alert('Invites sent successfully');
      setOpen(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
              <MenuItem value="User">User</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddUsers} disabled={loading}>
            {loading ? 'Sending...' : 'Add Users'}
          </Button>
        </DialogActions>
        {error && (
          <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
      </Dialog>
    </Box>
  );
}


// Duplicate handleDeleteUser function removed
