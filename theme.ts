"use client";
import { createTheme } from "@mui/material/styles";
import getMPTheme from "./src/theme/getMPTheme";

const lightTheme = createTheme(getMPTheme("light"));
const darkTheme = createTheme(getMPTheme("dark"));

const theme = {
  light: lightTheme,
  dark: darkTheme,
};

export default theme;
