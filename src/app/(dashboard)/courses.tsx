"use client";
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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { alpha, useTheme } from "@mui/material/styles";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_COURSES = [
  { id: "CS101", name: "Introduction to Computer Science", professor: "Dr. Alan Turing", enrolled: 245, modules: 12, department: "Computer Science", status: "active" },
  { id: "CS201", name: "Data Structures & Algorithms", professor: "Dr. Ada Lovelace", enrolled: 198, modules: 10, department: "Computer Science", status: "active" },
  { id: "MATH101", name: "Calculus I", professor: "Prof. Carl Gauss", enrolled: 312, modules: 14, department: "Mathematics", status: "active" },
  { id: "MATH201", name: "Linear Algebra", professor: "Prof. Emmy Noether", enrolled: 167, modules: 11, department: "Mathematics", status: "active" },
  { id: "PHY101", name: "Classical Mechanics", professor: "Dr. Isaac Newton", enrolled: 189, modules: 13, department: "Physics", status: "active" },
  { id: "PHY201", name: "Quantum Mechanics", professor: "Dr. Niels Bohr", enrolled: 74, modules: 9, department: "Physics", status: "active" },
  { id: "ENG101", name: "Technical Writing", professor: "Prof. Virginia Woolf", enrolled: 220, modules: 8, department: "English", status: "active" },
  { id: "BIO101", name: "Cell Biology", professor: "Dr. Rosalind Franklin", enrolled: 143, modules: 11, department: "Biology", status: "active" },
  { id: "CS301", name: "Machine Learning", professor: "Dr. Alan Turing", enrolled: 89, modules: 15, department: "Computer Science", status: "active" },
  { id: "ECON101", name: "Microeconomics", professor: "Prof. John Nash", enrolled: 275, modules: 10, department: "Economics", status: "active" },
  { id: "CS401", name: "Distributed Systems", professor: "Dr. Leslie Lamport", enrolled: 0, modules: 12, department: "Computer Science", status: "draft" },
  { id: "PHY301", name: "Electromagnetism", professor: "Dr. James Maxwell", enrolled: 0, modules: 10, department: "Physics", status: "draft" },
  { id: "HIST101", name: "Ancient Civilizations", professor: "Prof. Mary Beard", enrolled: 190, modules: 9, department: "History", status: "archived" },
  { id: "ART101", name: "Introduction to Art History", professor: "Prof. Hans Belting", enrolled: 134, modules: 7, department: "Arts", status: "archived" },
];

const DEPARTMENTS = ["Computer Science", "Mathematics", "Physics", "English", "Biology", "Economics", "History", "Arts"];

const EMPTY_FORM = {
  name: "",
  professor: "",
  enrolled: 0,
  modules: 1,
  department: "Computer Science",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const theme = useTheme();

  const [allCourses, setAllCourses] = useState({ active: MOCK_COURSES.filter(c => c.status === "active"), draft: MOCK_COURSES.filter(c => c.status === "draft"), archived: MOCK_COURSES.filter(c => c.status === "archived") });
  const [rows, setRows] = useState([]);
  const [courseFilter, setCourseFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Add dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const searchTimeout = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    return () => {
      isMountedRef.current = false;
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // ── Filtering / Search ───────────────────────────────────────────────────
  const applyFilter = useCallback((filter, query) => {
    setLoading(true);
    setTimeout(() => {
      if (!isMountedRef.current) return;
      const source = allCourses[filter] || [];
      const q = query.toLowerCase().trim();
      const filtered = q
        ? source.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.professor.toLowerCase().includes(q) ||
              c.id.toLowerCase().includes(q) ||
              c.department.toLowerCase().includes(q)
          )
        : source;
      setRows(filtered);
      setLoading(false);
    }, 150);
  }, [allCourses]);

  useEffect(() => {
    applyFilter(courseFilter, searchQuery);
  }, [courseFilter, allCourses]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setFormData(EMPTY_FORM);
    setError(null);
    setAddDialogOpen(true);
  };

  const handleAddCourse = () => {
    if (!formData.name.trim() || !formData.professor.trim()) {
      setError("Course name and professor are required.");
      return;
    }
    const id = formData.name.replace(/\s+/g, "").substring(0, 8).toUpperCase() + Math.floor(Math.random() * 900 + 100);
    const newCourse = { ...formData, id, status: "active" };
    setAllCourses((prev) => ({ ...prev, active: [newCourse, ...prev.active] }));
    setAddDialogOpen(false);
    setError(null);
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleOpenEdit = (row) => {
    setEditTarget(row);
    setEditForm({ name: row.name, professor: row.professor, enrolled: row.enrolled, modules: row.modules, department: row.department });
    setError(null);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.professor.trim()) {
      setError("Course name and professor are required.");
      return;
    }
    const update = (list) => list.map((c) => c.id === editTarget.id ? { ...c, ...editForm } : c);
    setAllCourses((prev) => ({ active: update(prev.active), draft: update(prev.draft), archived: update(prev.archived) }));
    setEditDialogOpen(false);
    setError(null);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    const course = rows.find((r) => r.id === id);
    if (!course) return;
    const msg = course.status === "draft" ? `Remove draft "${course.name}"?` : `Delete "${course.name}"? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    const remove = (list) => list.filter((c) => c.id !== id);
    setAllCourses((prev) => ({ active: remove(prev.active), draft: remove(prev.draft), archived: remove(prev.archived) }));
  };

  // ── Column defs ──────────────────────────────────────────────────────────
  const enrollmentColor = (n) => {
    if (n === 0) return theme.palette.text.disabled;
    if (n < 100) return theme.palette.warning.main;
    if (n < 200) return theme.palette.success.main;
    return theme.palette.primary.main;
  };

  const deptColors = {
    "Computer Science": theme.palette.primary.main,
    "Mathematics": "#8b5cf6",
    "Physics": "#06b6d4",
    "English": "#f59e0b",
    "Biology": "#22c55e",
    "Economics": "#ef4444",
    "History": "#d97706",
    "Arts": "#ec4899",
  };

  const columns = [
    { field: "id", headerName: "Course ID", width: 120 },
    {
      field: "name",
      headerName: "Course Name",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MenuBookIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "professor",
      headerName: "Professor",
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{params.value}</Typography>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      width: 160,
      renderCell: (params) => {
        const color = deptColors[params.value] || theme.palette.primary.main;
        return (
          <Chip
            label={params.value}
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 1,
              borderColor: color,
              color: color,
              bgcolor: alpha(color, 0.08),
              fontWeight: 500,
              fontSize: "0.72rem",
            }}
          />
        );
      },
    },
    {
      field: "enrolled",
      headerName: "Students Enrolled",
      width: 160,
      renderCell: (params) => {
        const n = params.value;
        const color = enrollmentColor(n);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <PeopleIcon sx={{ fontSize: 15, color }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color }}>{n.toLocaleString()}</Typography>
          </Box>
        );
      },
    },
    {
      field: "modules",
      headerName: "Modules",
      width: 110,
      renderCell: (params) => (
        <Chip
          label={`${params.value} modules`}
          size="small"
          sx={{
            borderRadius: 1,
            bgcolor: alpha(theme.palette.secondary.main, 0.1),
            color: theme.palette.secondary.main,
            fontWeight: 500,
            fontSize: "0.72rem",
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => {
        const isArchived = params.row.status === "archived";
        return isArchived ? (
          <Typography variant="caption" color="text.disabled">Archived</Typography>
        ) : (
          <>
            <GridActionsCellItem
              icon={<EditIcon sx={{ fontSize: 18 }} />}
              label="Edit"
              onClick={() => handleOpenEdit(params.row)}
            />
            <GridActionsCellItem
              icon={<DeleteIcon sx={{ fontSize: 18 }} />}
              label="Delete"
              onClick={() => handleDelete(params.row.id)}
            />
          </>
        );
      },
    },
  ];

  // ── Shared form fields ────────────────────────────────────────────────────
  const CourseFormFields = ({ data, onChange }) => (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField label="Course Name" value={data.name} onChange={(e) => onChange("name", e.target.value)} fullWidth required />
      <TextField label="Professor" value={data.professor} onChange={(e) => onChange("professor", e.target.value)} fullWidth required />
      <FormControl fullWidth>
        <InputLabel>Department</InputLabel>
        <Select value={data.department} onChange={(e) => onChange("department", e.target.value)} label="Department">
          {DEPARTMENTS.map((d) => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Students Enrolled"
          type="number"
          value={data.enrolled}
          onChange={(e) => onChange("enrolled", Math.max(0, parseInt(e.target.value) || 0))}
          inputProps={{ min: 0 }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Number of Modules"
          type="number"
          value={data.modules}
          onChange={(e) => onChange("modules", Math.max(1, parseInt(e.target.value) || 1))}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column", p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Course Management</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search + Add */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Search by course name, professor, ID, or department..."
          value={searchQuery}
          onChange={(e) => {
            const q = e.target.value;
            setSearchQuery(q);
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => applyFilter(courseFilter, q), 300);
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
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenAdd}
        >
          Add Course
        </Button>
      </Box>

      <div style={{ height: "calc(100vh - 210px)", width: "100%" }}>
        {/* Filter tabs */}
        <Box sx={{ display: "flex", mb: 2, gap: 1 }}>
          <ToggleButtonGroup
            value={courseFilter}
            exclusive
            onChange={(_, v) => { if (v) { setCourseFilter(v); applyFilter(v, searchQuery); } }}
            aria-label="course filter"
            size="small"
          >
            <ToggleButton value="active" aria-label="active courses">Active</ToggleButton>
            <ToggleButton value="draft" aria-label="draft courses">Draft</ToggleButton>
            <ToggleButton value="archived" aria-label="archived courses">Archived</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mounted && (
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pagination
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            getRowId={(row) => row.id}
            autoHeight={false}
            disableRowSelectionOnClick
            getRowClassName={(params) => {
              if (params.row.status === "draft") return "draft-row";
              if (params.row.status === "archived") return "archived-row";
              return "";
            }}
            sx={{
              "& .draft-row": { bgcolor: alpha(theme.palette.info.main, 0.05) },
              "& .archived-row": { bgcolor: alpha(theme.palette.text.disabled, 0.05), color: theme.palette.text.disabled },
              height: "calc(100% - 50px)",
              borderRadius: 1,
            }}
          />
        )}
      </div>

      {/* Add Course Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <CourseFormFields
            data={formData}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCourse} variant="contained" color="primary" disabled={loading}>
            {loading ? "Adding..." : "Add Course"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <CourseFormFields
            data={editForm}
            onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}