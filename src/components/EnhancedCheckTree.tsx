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

// Do a a shallow search for the item with the given value in the tree
const _recursiveFindValue = (node: TreeNode, value: ValueType): TreeNode | null => {
	if (node.value === value) {
		return node;
	}
	if (node.children) {
		for (const child of node.children) {
			const foundNode = _recursiveFindValue(child, value);
			if (foundNode) {
				return foundNode;
			}
		}
	}
	return null;
};

// Wrapper function to call the recursive function, passing the tree as a prop
export const recursiveFindValue = (tree: TreeNode[], value: ValueType): TreeNode | null => {
	return _recursiveFindValue({ children: tree }, value);
};

const EnhancedCheckTree: React.FC<EnhancedCheckTreeProps> = (props) => {
	const [disabledItemValues, setDisabledItemValues] = React.useState<ValueType[]>([]);
	const { data, set_data, disabled, ..._checkTreeProps } = props;
	const [checkTreeData, setCheckTreeData] = React.useState<TreeNode[]>(data);
	const checkTreeProps: CheckTreeProps = _checkTreeProps as CheckTreeProps;

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

		if (disabled) {
			setDisabledItemValues(getAllValuesInTree());
		} else {
			setDisabledItemValues([]);
		}
	}, [checkTreeData, disabled]);

	useEffect(() => {
		setCheckTreeData(data);
	}, [data]);

	return (
		<CheckTree
			{...checkTreeProps}
			disabledItemValues={disabledItemValues}
			onSelect={(activeNode) => {
				const checkTreeNode = recursiveFindValue(checkTreeData, activeNode.value as ValueType);
				if (checkTreeNode) {
					checkTreeNode.check = activeNode.check;
					recursiveChecking(checkTreeNode, activeNode);
					setCheckTreeData([...checkTreeData]);
				}
				set_data(checkTreeData);
			}}
			data={checkTreeData}
		/>
	);
};

export default EnhancedCheckTree;
