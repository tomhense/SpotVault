"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Home() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<div className="flex flex-col items-center justify-center w-full max-w-md p-12 bg-white rounded-lg shadow-md">
				<h1 className="text-6xl font-bold text-gray-800 mb-12">SpotVault</h1>
				{!isLoggedIn ? (
					<div className="flex flex-row items-center justify-center space-x-4">
						<div className="px-8 py-4 text-lg border-2 rounded-lg shadow-xl/30">
							<Link href="/backup" className="text-2xl">
								Backup
							</Link>
						</div>
						<div className="px-8 py-4 text-lg border-2 rounded-lg shadow-xl/30">
							<Link href="/restore" className="text-2xl">
								Restore
							</Link>
						</div>
					</div>
				) : (
					<button className="bg-blue-500 text-white px-12 py-4 rounded shadow-md hover:bg-blue-600 transition text-xl">Login</button>
				)}
			</div>
		</div>
	);
}
