"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import { CheckTree } from "rsuite";

const BackupPage: React.FC = () => {
	const [backupArtists, setBackupArtists] = React.useState(false);
	const [backupLibrary, setBackupLibrary] = React.useState(false);
	const [backupPlaylists, setBackupPlaylists] = React.useState(false);
	const [backupFollowedPlaylists, setBackupFollowedPlaylists] = React.useState(false);

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
		<div className="bg-gray-100">
			<Navbar />
			<div className="flex flex-col items-center justify-center h-screen p-4 space-y-4">
				<div className="shadow-lg p-4 rounded bg-white w-full max-w-md">
					<p className="text-xl font-bold mb-2">Choose what to backup</p>
					<div className="space-y-2">
						<CheckTree data={checkTreeData} defaultExpandAll={true} defaultChecked={true} disabledItemValues={[1]} />
					</div>
					<div className="mt-4 hidden text-gray-600">Status: Waiting...</div>
					<button className="w-full bg-blue-500 text-white mt-4 py-2 rounded shadow-md hover:bg-blue-600 transition" onClick={handleBackup}>
						Backup
					</button>
				</div>
			</div>
		</div>
	);
};

export default BackupPage;
