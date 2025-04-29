"use client";
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Container, Box, Typography, Paper, Button } from "@mui/material";
import { currentToken, tryRefreshToken } from "@/utils/spotify_auth";
import backup from "@/utils/backup";
import { TreeNode } from "rsuite/esm/internals/Tree/types";
import EnhancedCheckTree from "@/components/EnhancedCheckTree";

const BackupPage: React.FC = () => {
	const [checkTreeData, setCheckTreeData] = React.useState<TreeNode[]>([]);
	const [disableCheckTree, setDisableCheckTree] = React.useState(false);

	useEffect(() => {
		(async () => {
			await tryRefreshToken();

			// Check if the user is logged in
			if (currentToken.isExpired) {
				window.location.href = "/";
			}

			await backup.shallowFetch();

			const generateRandomId = () => {
				return Math.floor(Math.random() * 1e18);
			};

			// Populate the check tree with the data from the backup (the backups shallow fetch)
			setCheckTreeData([
				{ label: "Followed Artists", check: false, value: generateRandomId() },
				{
					label: "Saved Library",
					value: Math.random() * 1e18,
					check: false,
					children: [
						{ label: "Saved Albums", value: generateRandomId() },
						{ label: "Saved Tracks", value: generateRandomId() },
					],
				},
				{
					label: "Playlists",
					value: generateRandomId(),
					check: false,
					children: backup.playlists.map((playlist) => ({
						label: playlist.name,
						value: playlist.id,
					})),
				},
				{
					label: "Followed Playlists",
					value: generateRandomId(),
					check: false,
					children: backup.followed_playlists.map((playlist) => ({
						label: playlist.name,
						value: playlist.id,
					})),
				},
			]);
		})();
	}, []);

	async function createBackup() {
		setDisableCheckTree(true);

		const savedLibraryNodeChildren = checkTreeData.find((node) => node.label === "Saved Library")!.children as TreeNode[];
		const backupSavedTracks = savedLibraryNodeChildren.find((node: TreeNode) => node.label === "Saved Tracks")?.check || false;
		const backupSavedAlbums = savedLibraryNodeChildren.find((node: TreeNode) => node.label === "Saved Albums")?.check || false;
		const backupFollowedArtists = checkTreeData.find((node: TreeNode) => node.label === "Followed Artists")?.check || false;
		const checkedPlaylistsIds =
			checkTreeData
				.find((node) => node.label === "Playlists")
				?.children?.filter((node) => node.check)
				.map((node) => node.value as string) || [];

		const checkedFollowedPlaylistsIds =
			checkTreeData
				.find((node) => node.label === "Followed Playlists")
				?.children?.filter((node) => node.check)
				.map((node) => node.value as string) || [];

		await backup.createBackup(checkedPlaylistsIds, checkedFollowedPlaylistsIds, backupSavedTracks, backupSavedAlbums, backupFollowedArtists);
		await backup.downloadZip();
		setDisableCheckTree(false);
	}

	return (
		<Box sx={{ backgroundColor: "grey.100", minHeight: "100vh" }}>
			<Navbar />
			<Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
				<Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
					<Typography variant="h5" component="p" sx={{ marginBottom: 2, fontWeight: "bold" }}>
						Choose what to backup
					</Typography>
					<EnhancedCheckTree data={checkTreeData} defaultExpandAll={true} style={{ marginBottom: 2 }} disabled={disableCheckTree} set_data={setCheckTreeData} />
					<Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={createBackup}>
						Backup
					</Button>
				</Paper>
			</Container>
		</Box>
	);
};

export default BackupPage;
