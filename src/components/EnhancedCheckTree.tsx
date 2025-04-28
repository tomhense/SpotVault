import React from "react";
import { useEffect } from "react";
import { CheckTree, CheckTreeProps } from "rsuite";
import { ValueType } from "rsuite/esm/Checkbox";
import { TreeNode } from "rsuite/esm/internals/Tree/types";

interface EnhancedCheckTreeProps extends CheckTreeProps {
	data: TreeNode[];
	set_data: (data: TreeNode[]) => void;
	disabled: boolean;
}

const EnhancedCheckTree: React.FC<EnhancedCheckTreeProps> = (props) => {
	const [checkTreeData, setCheckTreeData] = React.useState<TreeNode[]>([]);
	const [disabledItemValues, setDisabledItemValues] = React.useState<ValueType[]>([]);

	// Do a a shallow search for the item with the given value in the tree
	const recursiveFind = (node: TreeNode, value: ValueType): TreeNode | null => {
		if (node.value === value) {
			return node;
		}
		if (node.children) {
			for (const child of node.children) {
				const foundNode = recursiveFind(child, value);
				if (foundNode) {
					return foundNode;
				}
			}
		}
		return null;
	};

	// Recursively check all children of the given node
	const recursiveChecking = (node: TreeNode, activeNode: TreeNode) => {
		if (node.children) {
			node.children.forEach((child: TreeNode) => {
				child.check = activeNode.check;
				recursiveChecking(child, activeNode);
			});
		}
	};

	useEffect(() => {
		const _getAllValuesInTree = (data: TreeNode) => {
			// Returns all values in the tree
			const ids = [];
			if (data.value) ids.push(data.value);
			if (data.children) {
				data.children.forEach((child) => {
					ids.push(..._getAllValuesInTree(child));
				});
			}
			return ids;
		};

		const getAllValuesInTree = () => {
			return _getAllValuesInTree({ children: checkTreeData });
		};

		if (props.disabled) {
			setDisabledItemValues(getAllValuesInTree());
		} else {
			setDisabledItemValues([]);
		}
	}, [checkTreeData, props.disabled]);

	useEffect(() => {
		setCheckTreeData(props.data);
	}, [props.data]);

	return (
		<CheckTree
			disabledItemValues={disabledItemValues}
			onSelect={(activeNode) => {
				const checkTreeNode = recursiveFind({ children: checkTreeData }, activeNode.value as ValueType);
				if (checkTreeNode) {
					checkTreeNode.check = activeNode.check;
					recursiveChecking(checkTreeNode, activeNode);
				}
				props.set_data(checkTreeData);
			}}
			{...(props as CheckTreeProps)}
		/>
	);
};

export default EnhancedCheckTree;
