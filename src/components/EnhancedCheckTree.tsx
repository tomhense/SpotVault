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
	const [checkTreeData, setCheckTreeData] = React.useState<TreeNode[]>([]);
	const [disabledItemValues, setDisabledItemValues] = React.useState<ValueType[]>([]);

	// Destructure props to get remaining props for CheckTree, sadly this leaves us with vars that are unused (there is no better way)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { set_data: _set_data, disabled: _disabled, ...checkTreeProps } = props;

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
				const checkTreeNode = recursiveFindValue(checkTreeData, activeNode.value as ValueType);
				if (checkTreeNode) {
					checkTreeNode.check = activeNode.check;
					recursiveChecking(checkTreeNode, activeNode);
				}
				props.set_data(checkTreeData);
			}}
			{...checkTreeProps}
		/>
	);
};

export default EnhancedCheckTree;
