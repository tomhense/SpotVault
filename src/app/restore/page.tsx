"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";

const RestorePage: React.FC = () => {
	const [fileDropped, setFileDropped] = useState(false);

	const handleFileDrop = () => {
		setFileDropped(true);
	};

	return (
		<div>
			<Navbar />
			<div className="flex flex-col items-center justify-center h-screen p-4 space-y-4">
				<div className="shadow-lg p-4 rounded bg-white w-full max-w-md">
					{fileDropped ? (
						<div className="space-y-2">
							<label className="block">
								<input type="checkbox" className="mr-2" />
								Option 1
							</label>
							<label className="block">
								<input type="checkbox" className="mr-2" />
								Option 2
							</label>
							<label className="block">
								<input type="checkbox" className="mr-2" />
								Option 3
							</label>
						</div>
					) : (
						<div className="border-3 border-dashed p-4 text-center cursor-pointer" onClick={handleFileDrop}>
							Drag file here or click to upload
						</div>
					)}
					{fileDropped && <div className="mt-4 text-gray-600">Status: Ready to Restore</div>}
					{fileDropped && <button className="w-full bg-blue-500 text-white mt-4 py-2 rounded shadow-md hover:bg-blue-600 transition">Restore</button>}
				</div>
			</div>
		</div>
	);
};

export default RestorePage;
