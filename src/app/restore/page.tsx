"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Container, Box, Paper, Typography, Button, FormControlLabel, Checkbox } from "@mui/material";
import { currentToken, tryRefreshToken } from "@/utils/spotify_auth";

const RestorePage: React.FC = () => {
	useEffect(() => {
		(async () => {
			await tryRefreshToken();

			// Check if the user is logged in
			if (currentToken.isExpired) {
				window.location.href = "/";
			}
		})();
	}, []);

	const [fileDropped, setFileDropped] = useState(false);

	const handleFileDrop = () => {
		setFileDropped(true);
	};

	return (
		<Box sx={{ minHeight: "100vh", backgroundColor: "grey.100" }}>
			<Navbar />
			<Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
				<Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
					{fileDropped ? (
						<Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<FormControlLabel control={<Checkbox />} label="Option 1" />
							<FormControlLabel control={<Checkbox />} label="Option 2" />
							<FormControlLabel control={<Checkbox />} label="Option 3" />
						</Box>
					) : (
						<Box
							sx={{
								border: "2px dashed",
								padding: 4,
								textAlign: "center",
								cursor: "pointer",
								"&:hover": { backgroundColor: "grey.200" },
							}}
							onClick={handleFileDrop}
						>
							Drag file here or click to upload
						</Box>
					)}
					{fileDropped && (
						<Typography variant="body2" sx={{ color: "grey.600", marginTop: 2 }}>
							Status: Ready to Restore
						</Typography>
					)}
					{fileDropped && (
						<Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }}>
							Restore
						</Button>
					)}
				</Paper>
			</Container>
		</Box>
	);
};

export default RestorePage;
