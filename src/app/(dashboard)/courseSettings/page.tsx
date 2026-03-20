"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCourse } from "../../context/CourseContext";

export default function CourseSettingsPage() {
  const router = useRouter();
  const { selectedCourse, selectCourse } = useCourse();
  const { accessLevel, loading } = useAuth();
  const canEditCourses = (accessLevel ?? 0) >= 9;

  const [formData, setFormData] = React.useState({
    id: "",
    name: "",
    professor: "",
    department: "",
    modules: 1,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedCourse) {
      router.push("/courses");
      return;
    }
    setFormData({
      id: selectedCourse.id,
      name: selectedCourse.name,
      professor: selectedCourse.professor,
      department: selectedCourse.department,
      modules: selectedCourse.modules,
    });
  }, [router, selectedCourse]);

  if (loading || !selectedCourse) return null;

  if (!canEditCourses) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You need access level 9 or higher to edit course settings.
        </Alert>
      </Box>
    );
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.professor.trim() || !formData.department.trim()) {
      setError("Course name, professor, and department are required.");
      setSuccess(null);
      return;
    }

    selectCourse({
      ...selectedCourse,
      name: formData.name.trim(),
      professor: formData.professor.trim(),
      department: formData.department.trim(),
      modules: Math.max(1, Number(formData.modules) || 1),
    });

    setError(null);
    setSuccess("Course settings saved.");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Course Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Update the selected course details.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card variant="outlined" sx={{ maxWidth: 700 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Course ID" value={formData.id} disabled fullWidth />
          <TextField
            label="Course Name"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Professor"
            value={formData.professor}
            onChange={(event) => setFormData((prev) => ({ ...prev, professor: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Department"
            value={formData.department}
            onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Number of Modules"
            type="number"
            value={formData.modules}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                modules: Math.max(1, parseInt(event.target.value, 10) || 1),
              }))
            }
            inputProps={{ min: 1 }}
            fullWidth
          />

          <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
