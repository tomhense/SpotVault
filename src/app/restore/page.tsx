"use client";
import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { Container, Box, Paper, Typography, Button } from "@mui/material";
import Dropzone from "react-dropzone";

import { currentToken, tryRefreshToken } from "@/utils/spotify_auth";
import Backup, { BackupOptions } from "@/utils/backup";
import BackupCheckTree from "@/utils/BackupCheckTree";

const RestorePage: React.FC = () => {
	const [checkTreeDisabled, setCheckTreeDisabled] = React.useState(false);
	const [backupOptions, setBackupOptions] = React.useState<BackupOptions | null>(null);
	const [fileDropped, setFileDropped] = useState(false);
	const [dropzoneDisabled, setDropzoneDisabled] = useState(false);
	const backup: React.RefObject<Backup | null> = useRef(null);

	useEffect(() => {
		(async () => {
			await tryRefreshToken();

			// Check if the user is logged in
			if (currentToken.isExpired) {
				window.location.href = "/";
			}
		})();
	}, []);

	const onDropHandler = async (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 1) {
			setDropzoneDisabled(true);
			try {
				backup.current = await Backup.fromZip(acceptedFiles[0]!);
				setFileDropped(true);
				setDropzoneDisabled(false);
			} catch (error) {
				console.error("Error loading backup:", error);
				alert("Error loading backup. Please make sure the file is a valid SpotVault backup.");
				setDropzoneDisabled(false);
				return;
			}
		} else {
			alert("Please drop only one file");
		}
	};

	async function restoreBackup() {
		if (!backup.current) return;
		setCheckTreeDisabled(true);
		await backup.current.restoreBackup(backupOptions!);
		alert("Backup restored successfully!");
		setCheckTreeDisabled(false);
	}

	return (
		<Box sx={{ minHeight: "100vh", backgroundColor: "grey.100" }}>
			<Navbar />
			<Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
				<Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
					{fileDropped ? (
						<BackupCheckTree disabled={checkTreeDisabled} backup={backup.current!} onChangeBackupOptions={setBackupOptions} />
					) : (
						<Dropzone onDrop={onDropHandler} disabled={dropzoneDisabled}>
							{({ getRootProps, getInputProps }) => (
								<section>
									<div {...getRootProps()}>
										<input {...getInputProps()} />
										<p>Drag &apos;n&apos; drop some files here, or click to select files</p>
									</div>
								</section>
							)}
						</Dropzone>
					)}
					{fileDropped && (
						<Typography variant="body2" sx={{ color: "grey.600", marginTop: 2 }}>
							Status: Ready to Restore
						</Typography>
					)}
					{fileDropped && (
						<Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={restoreBackup} disabled={checkTreeDisabled}>
							Restore
						</Button>
					)}
				</Paper>
			</Container>
		</Box>
	);
};

export default RestorePage;
