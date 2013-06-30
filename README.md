HTML search function
====================

The motivation for writing this was to replace window.find for vimium. So far,
the only improvement over window.find is support for regular expressions. But
it is possible to implement some features that cannot be directly implemented
in window.find.

TODO
----

- Implement ignorecase.

- Support in place search directly (used by vimium).

- Support scrolling.

- Strange selection range behavior when matching spaces after the last text
  node (e.g. between these two end tags: </p>   </body>). This does not happen
  with window.find. Currently there is a workaround in place which tries to
  detect this case and restarts the search with an empty selection.

- Repeated search with empty matches does not move forward. E.g. with /\b/, or
  with /.*/ on empty nodes, we find the same match over and over again.

- The parameter set (regex, pattern, ignorecase, forward) should be member
  variables of a class, and findRegex, findSubstring should be the findMatch
  method of the corresponding subclasses.
