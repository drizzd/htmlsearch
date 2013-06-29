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
		offset = range.startOffset;
	}

	var index = textNodes.indexOf(node);
	if (index < 0) {
		return 0;
	}

	return visibleText(textNodes.slice(0, index)).length + offset;
}

function find_substring_1(text, pattern, forward, startOffset) {
	if (forward) {
		return text.indexOf(pattern, startOffset);
	} else {
		var offset = startOffset - pattern.length;
		if (offset < 0) {
			return -1;
		}
		return text.lastIndexOf(pattern, offset);
	}
}

function find_substring(text, pattern, forward, startOffset) {
	var wraparound = false;
	var index = find_substring_1(text, pattern, forward, startOffset);
	if (index < 0) {
		wraparound = true;
		startOffset = 0;
		if (!forward) {
			startOffset = text.length+1;
		}
		index = find_substring_1(text, pattern, forward, startOffset);
	}

	if (index < 0)
		return null;

	return { "index": index, "wraparound": wraparound };
}

function find_regex(text, pattern, forward, startOffset) {
	var index = -1;
	var wraparound = false;

	try {
		var re = new RegExp(pattern, "g");
	} catch (error) {
		return null;
	}
	re.lastIndex = startOffset;
	while (true) {
		/* If an empty string matches, lastIndex is not incremented. */
		var prevLastIndex;
		if (prevLastIndex !== null && re.lastIndex == prevLastIndex) {
			re.lastIndex += 1;
		}
		prevLastIndex = re.lastIndex;

		var match = re.exec(text);

		if (match == null && startOffset > 0 && !wraparound) {
			wraparound = true;
			match = re.exec(text);
		}
		if (match == null) {
			break;
		}

		if (forward) {
			/* Done with the first match. */
			index = match.index;
			break;
		} else if (wraparound && match.index >= startOffset) {
			/*
			 * We wrapped around and passed startOffset. We
			 * already found the first backward match in the
			 * previous iteration.
			 */
			break;
		} else {
			/* Keep track of the last match until we pass
			 * startOffset. */
			index = match.index;
		}
	}

	return { "index": index, "wraparound": wraparound };
}

function find_match(text, regex, pattern, forward, startOffset) {
	if (regex) {
		return find_regex(text, pattern, forward, startOffset);
	} else {
		return find_substring(text, pattern, forward, startOffset);
	}
}

function search(regex, pattern, forward, startAt) {
	if (forward == null) {
		forward = true;
	}
	var textNodes = visibleTextNodes(document.body);
	var startOffset = 0;
	if (startAt !== null) {
		startOffset = indexAt(textNodes, startAt, forward);
	}

	var text = visibleText(textNodes);
	var match = find_match(text, regex, pattern, forward, startOffset);
	if (match == null) {
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

function select_match(regex, pattern, forward) {
	var selection = window.getSelection();
	var startAt = null;
	if (selection.type != "None") {
		startAt = selection.getRangeAt(0);
	}

	var match = search(regex, pattern, forward, startAt);
	if (match !== null) {
		select(match.range)
	}

	return match;
}
