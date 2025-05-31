"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button, Container, Typography, Paper, Box } from "@mui/material";
import { currentToken, tryFetchAndHandleAuthCode, redirectToSpotifyAuthorize, tryRefreshToken } from "@/utils/spotify_auth";
import { NoSsr } from "@mui/material";
import Navbar from "@/components/Navbar";

export default function Home() {
	const [isLoggedIn, setIsLoggedIn] = React.useState(false);

	useEffect(() => {
		(async () => {
			setIsLoggedIn(currentToken.notNull);

			if (await tryFetchAndHandleAuthCode()) {
				setIsLoggedIn(true);
			} else {
				await tryRefreshToken();
			}
		})();
	}, []);

	return (
		<Box sx={{ backgroundColor: "grey.100", minHeight: "100vh" }}>
			<Navbar />
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
					<NoSsr>
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
							<Button variant="contained" color="primary" size="large" onClick={redirectToSpotifyAuthorize}>
								Login
							</Button>
						)}
					</NoSsr>
				</Paper>
			</Container>
		</Box>
	);
}
