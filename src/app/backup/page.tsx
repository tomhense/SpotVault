"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import { CheckTree } from "rsuite";
import { Container, Box, Typography, Paper, Button } from "@mui/material";

const BackupPage: React.FC = () => {
	//const [backupArtists, setBackupArtists] = React.useState(false);
	//const [backupLibrary, setBackupLibrary] = React.useState(false);
	//const [backupPlaylists, setBackupPlaylists] = React.useState(false);
	//const [backupFollowedPlaylists, setBackupFollowedPlaylists] = React.useState(false);

	const handleBackup = () => {
		// Logic to handle backup
	};

	const checkTreeData = [
		{ label: "Followed Artists", value: 1 },
		{
			label: "Saved Library",
			value: Math.random() * 1e18,
			children: [
				{ label: "Saved Albums", value: Math.random() * 1e18 },
				{ label: "Saved Tracks", value: Math.random() * 1e18 },
				{ label: "Saved Podcasts", value: Math.random() * 1e18 },
			],
		},
		{
			label: "Playlists",
			value: Math.random() * 1e18,
			children: [
				{ label: "Playlist 1", value: Math.random() * 1e18 },
				{ label: "Playlist 2", value: Math.random() * 1e18 },
			],
		},
		{
			label: "Followed Playlists",
			value: Math.random() * 1e18,
			children: [
				{ label: "Playlist 1", value: Math.random() * 1e18 },
				{ label: "Playlist 2", value: Math.random() * 1e18 },
			],
		},
	];

	return (
		<Box sx={{ backgroundColor: "grey.100", minHeight: "100vh" }}>
			<Navbar />
			<Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
				<Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
					<Typography variant="h5" component="p" sx={{ marginBottom: 2, fontWeight: "bold" }}>
						Choose what to backup
					</Typography>
					<CheckTree data={checkTreeData} defaultExpandAll={true} defaultChecked={true} disabledItemValues={[1]} style={{ marginBottom: 2 }} />
					<Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={handleBackup}>
						Backup
					</Button>
				</Paper>
			</Container>
		</Box>
	);
};

export default BackupPage;
