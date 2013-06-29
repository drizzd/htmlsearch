/*
 * Copyright (C) 2013 Clemens Buchacher
 *
 * Much inspired by Alexey Lebedev's answer in
 * http://stackoverflow.com/questions/12445579/javascript-window-find-does-not-select-search-term.
 */

function visibleTextNodeWalker(topNode) {
	function acceptNode(node) {
		if (node.nodeType == Node.TEXT_NODE)
			return NodeFilter.FILTER_ACCEPT;
		else if (node.offsetWidth && node.offsetHeight && node.style.visibility != 'hidden')
			return NodeFilter.FILTER_SKIP;
		else
			return NodeFilter.FILTER_REJECT;
	}
	return document.createTreeWalker(topNode, NodeFilter.SHOW_ALL, acceptNode, false);
}

function makeNodeArray(walker) {
	var nodeArray = [];
	while (walker.nextNode()) {
		nodeArray.push(walker.currentNode);
	}

	return nodeArray;
}

function visibleTextNodes(topNode) {
	return makeNodeArray(visibleTextNodeWalker(topNode));
}

function nodeValues(nodes) {
	var values = [];
	for (var i = 0; i < nodes.length; i++) {
		values.push(nodes[i].nodeValue);
	}
	return values;
}

function visibleText(nodes) {
	return nodeValues(nodes).join("");
}

function nodeAt(nodeArray, index) {
	var pos = 0;
	for (var i = 0; i < nodeArray.length; i++) {
		var node = nodeArray[i];
		var next_pos = pos + node.nodeValue.length;
		if (index < next_pos) {
			return [node, index - pos];
		}

		pos = next_pos;
	}

	return null;
}

function indexAt(textNodes, range) {
	var node = range.endContainer;
	var offset = range.endOffset;

	var index = textNodes.indexOf(node);
	if (index < 0) {
		return 0;
	}

	return visibleText(textNodes.slice(0, index)).length + offset;
}

function search(pattern, startAt) {
	var textNodes = visibleTextNodes(document.body);
	var startOffset = 0;
	if (startAt != null) {
		startOffset = indexAt(textNodes, startAt);
	}

	var wraparound = false;
	var text = visibleText(textNodes);
	var index = text.indexOf(pattern, startOffset);
	if (index < 0) {
		var index = text.indexOf(pattern);
		if (index < 0)
			return null;
		wraparound = true;
	}

	var range = document.createRange();
	range.setStart.apply(range, nodeAt(textNodes, index));
	range.setEnd.apply(range, nodeAt(textNodes, index + pattern.length));

	return { "range": range, "wraparound": wraparound };
}

function select(range) {
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
}

function select_match(pattern) {
	var selection = window.getSelection();
	var startAt = null;
	if (selection.type != "None") {
		startAt = selection.getRangeAt(0);
	}

	var match = search(pattern, startAt);
	if (match != null) {
		select(match.range)
	}

	return match;
}
