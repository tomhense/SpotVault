import Link from "next/link";
import React from "react";

const Navbar: React.FC = () => {
	return (
		<nav className="flex items-center justify-between p-4 sticky top-0">
			<div className="flex items-center justify-between">
				<Link href="/" className="text-2xl font-bold">
					SpotVault
				</Link>
			</div>
			<div className="flex items-center justify-end space-x-4">
				<button className="border-solid px-4 py-2 rounded hover:border-2 transition">Logout</button>
			</div>
		</nav>
	);
};

export default Navbar;
