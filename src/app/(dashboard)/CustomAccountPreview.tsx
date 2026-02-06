"use client";
import { getCookie } from "@/utils/cookies";
import { Avatar, Box, Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AccountPreview, AccountPreviewProps } from "@toolpad/core/Account";
import { jwtDecode } from "jwt-decode";
import * as React from "react";

interface DecodedToken {
  user_id?: string;
  user: string;
  access_level?: number;
}

// Enhanced version of AccountPreview that includes name and role
export default function CustomAccountPreview(props: AccountPreviewProps) {
  const theme = useTheme();
  const [userName, setUserName] = React.useState<string>("");
  const [userRole, setUserRole] = React.useState<string>("Guest");
  const [mounted, setMounted] = React.useState<boolean>(false);
  const [roleConfig, setRoleConfig] = React.useState<{
    color: string;
    bgColor: string;
  }>({ 
    color: theme.palette.text.disabled, 
    bgColor: alpha(theme.palette.text.disabled, 0.1) 
  });

  React.useEffect(() => {
    setMounted(true);
    const token = getCookie("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);

        // Determine display name
        let displayName = decoded.user || "";
        setUserName(displayName || "User");

        // Determine role based on access level
        const accessLevel = decoded.access_level;
        if (accessLevel === 9) {
          setUserRole("Admin");
          setRoleConfig({
            color: theme.palette.error.main,
            bgColor: alpha(theme.palette.error.main, 0.1)
          });
        } else if (accessLevel && accessLevel >= 5) {
          setUserRole("Manager");
          setRoleConfig({
            color: theme.palette.warning.main,
            bgColor: alpha(theme.palette.warning.main, 0.1)
          });
        } else if (accessLevel && accessLevel >= 1) {
          setUserRole("User");
          setRoleConfig({
            color: theme.palette.primary.main,
            bgColor: alpha(theme.palette.primary.main, 0.1)
          });
        } else {
          setUserRole("Guest");
          setRoleConfig({
            color: theme.palette.text.disabled,
            bgColor: alpha(theme.palette.text.disabled, 0.1)
          });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [theme]);

  return (
    <Box>
      {mounted && (
        <AccountPreview
          {...props}
          slots={{
            avatar: () => (
              <>
                {props.variant === "expanded" ? (
                  <Avatar src={props.slotProps?.avatar?.src} />
                ) : (
                  <Avatar
                    src={props.slotProps?.avatar?.src}
                    sx={{ width: 32, height: 32 }}
                  />
                )}
                {props.variant === "expanded" && (
                  <div
                    style={{
                      flexDirection: "column",
                      display: "flex",
                      alignItems: "left",
                      justifyContent: "center",
                      marginLeft: 10
                    }}
                  >
                    <span style={{ 
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "150px",
                    }}>
                      {userName}
                    </span>
                    <Chip
                      label={userRole}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        bgcolor: roleConfig.bgColor,
                        color: roleConfig.color,
                        borderColor: roleConfig.color,
                        borderRadius: 1
                      }}
                    />
                  </div>
                )}
              </>
            ),
          }}
          sx={{
            "& .MuiTypography-root": { display: "none" },
            display: "flex",
            alignItems: "center",
            "& .MuiIconButton-root": { mr: 0 },
          }}
        />
      )}
    </Box>
  );
}
