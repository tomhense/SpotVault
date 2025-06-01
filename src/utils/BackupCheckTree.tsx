import EnhancedCheckTree from "@/components/EnhancedCheckTree";
import React from "react";
import { useEffect } from "react";
import { TreeNode } from "rsuite/esm/internals/Tree/types";
import Backup, { BackupOptions } from "./backup";

interface BackupCheckTreeProps {
	backup: Backup;
	disabled: boolean;
	onChangeBackupOptions: (options: BackupOptions) => void;
}

const BackupCheckTree: React.FC<BackupCheckTreeProps> = (props) => {
	const [checkTreeData, setCheckTreeData] = React.useState<TreeNode[]>([]);

	// Destructure props, needed to mitigate stack overflow in useEffect
	const { backup, disabled, onChangeBackupOptions } = props;

	useEffect(() => {
		const generateRandomId = () => {
			return Math.floor(Math.random() * 1e18);
		};

		// Populate the check tree with the data from the backup (the backups shallow fetch)
		const tempCheckTreeData: TreeNode[] = [
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
		];
		setCheckTreeData(tempCheckTreeData);

		// Set the initial state of the check tree based on the backup options
		const savedLibraryNodeChildren = tempCheckTreeData.find((node) => node.label === "Saved Library")!.children as TreeNode[];
		const backupSavedTracks = savedLibraryNodeChildren.find((node: TreeNode) => node.label === "Saved Tracks")?.check || false;
		const backupSavedAlbums = savedLibraryNodeChildren.find((node: TreeNode) => node.label === "Saved Albums")?.check || false;
		const backupFollowedArtists = tempCheckTreeData.find((node: TreeNode) => node.label === "Followed Artists")?.check || false;
		const checkedPlaylistsIds =
			tempCheckTreeData
				.find((node) => node.label === "Playlists")
				?.children?.filter((node) => node.check)
				.map((node) => node.value as string) || [];

		const checkedFollowedPlaylistsIds =
			tempCheckTreeData
				.find((node) => node.label === "Followed Playlists")
				?.children?.filter((node) => node.check)
				.map((node) => node.value as string) || [];

		const tempBackupOptions: BackupOptions = {
			backupSavedTracks,
			backupSavedAlbums,
			backupFollowedArtists,
			checkedPlaylistsIds,
			checkedFollowedPlaylistsIds,
		};
		onChangeBackupOptions(tempBackupOptions);
	}, [backup, onChangeBackupOptions]);

	return <EnhancedCheckTree data={checkTreeData} defaultExpandAll={true} style={{ marginBottom: 2 }} disabled={disabled} set_data={setCheckTreeData} />;
};

export default BackupCheckTree;
