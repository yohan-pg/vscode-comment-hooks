# Comment Hooks

Add bash hooks to file operations (open/save/close) using comments within them.

## Examples

```
#on save: make
#on open close: echo $(date) > timestamp.txt

def main():
    ...
```

Multiple hooks can be included in the same file. 
The following comment types are supported: "<!--", "#", "//", "--", "%", "(*".

## Environment Variables
Hooks have access to the following environment variables:
`$file` (the absolute file path), `$relativeFile` (the file path relative to the current workspace), `$hookType` (either 'open' 'save' or 'close' based on which hook was executed), and `$workspaceFolder` (the path to the current workspace).
						