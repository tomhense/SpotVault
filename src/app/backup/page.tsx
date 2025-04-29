"use client";
import React, { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Container, Box, Typography, Paper, Button } from "@mui/material";
import { currentToken, tryRefreshToken } from "@/utils/spotify_auth";
import Backup, { BackupOptions } from "@/utils/backup";
import BackupCheckTree from "@/utils/BackupCheckTree";

const BackupPage: React.FC = () => {
	const [checkTreeDisabled, setCheckTreeDisabled] = React.useState(false);
	const [backupOptions, setBackupOptions] = React.useState<BackupOptions | null>(null);
	const backup = useRef(new Backup());

	useEffect(() => {
		(async () => {
			await tryRefreshToken();

			// Check if the user is logged in
			if (currentToken.isExpired) {
				window.location.href = "/";
			}

			await backup.current.shallowFetch();
		})();
	}, [backup]);

	async function createBackup() {
		if (!backupOptions) return;
		setCheckTreeDisabled(true);
		await backup.current.createBackup(backupOptions);
		await backup.current.downloadZip();
		setCheckTreeDisabled(false);
	}

	return (
		<Box sx={{ backgroundColor: "grey.100", minHeight: "100vh" }}>
			<Navbar />
			<Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
				<Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
					<Typography variant="h5" component="p" sx={{ marginBottom: 2, fontWeight: "bold" }}>
						Choose what to backup
					</Typography>
					<BackupCheckTree disabled={checkTreeDisabled} backup={backup.current} onChangeBackupOptions={setBackupOptions} />
					<Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={createBackup}>
						Backup
					</Button>
				</Paper>
			</Container>
		</Box>
	);
};

export default BackupPage;
