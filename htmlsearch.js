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

function indexAt(textNodes, range, forward) {
	var node, offset;

	if (forward) {
		node = range.endContainer;
		offset = range.endOffset;
	} else {
		node = range.startContainer;
		offset = range.startOffset - 1;
	}

	var index = textNodes.indexOf(node);
	if (index < 0) {
		return 0;
	}

	return visibleText(textNodes.slice(0, index)).length + offset;
}

function find_string_1(text, pattern, forward, startOffset) {
	if (forward) {
		return text.indexOf(pattern, startOffset);
	} else {
		if (startOffset < 0) {
			return -1;
		}
		return text.lastIndexOf(pattern, startOffset);
	}
}

function find_string(text, pattern, forward, startOffset) {
	var wraparound = false;
	var index = find_string_1(text, pattern, forward, startOffset);
	if (index < 0) {
		wraparound = true;
		startOffset = 0;
		if (!forward) {
			startOffset = text.length;
		}
		var index = find_string_1(text, pattern, forward, startOffset);
	}

	return { "index": index, "wraparound": wraparound };
}

function search(pattern, forward, startAt) {
	if (forward == null) {
		forward = true;
	}
	var textNodes = visibleTextNodes(document.body);
	var startOffset = 0;
	if (startAt != null) {
		startOffset = indexAt(textNodes, startAt, forward);
	}

	var text = visibleText(textNodes);
	var match = find_string(text, pattern, forward, startOffset);
	if (match.index < 0) {
		return null;
	}

	var range = document.createRange();
	range.setStart.apply(range, nodeAt(textNodes, match.index));
	range.setEnd.apply(range, nodeAt(textNodes, match.index + pattern.length));

	return { "range": range, "wraparound": match.wraparound };
}

function select(range) {
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
}

function select_match(pattern, forward) {
	var selection = window.getSelection();
	var startAt = null;
	if (selection.type != "None") {
		startAt = selection.getRangeAt(0);
	}

	var match = search(pattern, forward, startAt);
	if (match != null) {
		select(match.range)
	}

	return match;
}
