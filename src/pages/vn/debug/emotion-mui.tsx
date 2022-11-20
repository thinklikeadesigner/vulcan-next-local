import React from "react";
import { Box, Typography, Container } from "@mui/material"; // Next has tree shaking
import EmotionButton from "~/core/components/ui/EmotionButton";

export default function MuiSCPage() {
  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Material UI and Styled components
        </Typography>
        <EmotionButton preferredTechnology="vulcan">
          I am an orange styled button
        </EmotionButton>
      </Box>
    </Container>
  );
}
