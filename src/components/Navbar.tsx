import React from "react";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

const Navbar: React.FC = () => {
	return (
		<AppBar position="sticky" sx={{ backgroundColor: "primary.main" }}>
			<Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
				<Box>
					<Typography
						component={Link}
						href="/"
						variant="h6"
						sx={{
							color: "inherit",
							textDecoration: "none",
							fontWeight: "bold",
						}}
					>
						SpotVault
					</Typography>
				</Box>
				<Box>
					<Button
						variant="outlined"
						color="inherit"
						sx={{
							textTransform: "none",
							border: "1px solid",
							"&:hover": {
								borderWidth: "2px",
							},
						}}
					>
						Logout
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default Navbar;
