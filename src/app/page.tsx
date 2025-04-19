"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button, Container, Typography, Paper, Box } from "@mui/material";

export default function Home() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	return (
		<Container
			maxWidth="lg"
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				backgroundColor: "grey.100",
			}}
		>
			<Paper
				elevation={3}
				sx={{
					padding: 4,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Typography variant="h2" component="h1" sx={{ marginBottom: 4 }} gutterBottom>
					SpotVault
				</Typography>
				{isLoggedIn ? (
					<Box sx={{ display: "flex", gap: 2 }}>
						<Button variant="outlined" component={Link} href="/backup" size="large">
							Backup
						</Button>
						<Button variant="outlined" component={Link} href="/restore" size="large">
							Restore
						</Button>
					</Box>
				) : (
					<Button variant="contained" color="primary" size="large" onClick={() => setIsLoggedIn(false)}>
						Login
					</Button>
				)}
			</Paper>
		</Container>
	);
}
