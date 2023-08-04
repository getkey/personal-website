---
title: "Privilege escalation with setuid"
tags: ["setuid", "setgid", "UNIX", "CLI"]
date: "2014-09-12T19:17:49Z"
lang: "en"
license: "CC-BY-4.0"
aliases: ["/blog/541346dd/privilege-escalation-with-setuid"]
---

## What are setuid and setgid?

When applied on executable (and shell scripts if it's not disabled), setuid is a mechanism in UNIX systems to allow an user to execute a program with the owner's permissions. Setguid is the same principle, but we get the group permission instead of the user's.
If you want too know more about it or setgid (that we won't use), read the [Wikipedia article](https://en.wikipedia.org/wiki/Setuid).

In this article we will create a C program we will run as a normal user, and thanks to setuid it will spawn for us a shell (as root!).

## The code

Here's the code:
```c
#include <unistd.h>

int main()
{
	setuid(0);
	execl("/bin/bash", "bash", (char *)NULL);
	return 0;
}
```

`#include <unistd.h>` This library is needed to get `setuid()` and `execl()`.
`setuid(0)` We get privileges from the user 0, ie root.
`execl("/bin/bash", "bash", (char *)NULL);` Our program executes `/bin/bash`. The parameter `"bash"` is the filename of the program we execute, passing it is a convention.
`(char *)NULL)` The manual says our last argument must be a null pointer. This weird formula is the multiplatform version.

That's it. Pretty simple, uh?

## Let's try it!

Okay, now that we have our C source, we compile it:
`$ gcc -Wall trickyty.c -o trickyty` (my source file is trickyty.c).

Remember? The program must be owned by the setuided user, in this case: root.
```console
$ sudo chown root trickyty
```
And the program must have the setuid bit turned on.
```console
$ sudo chmod u+s trickyty
```

A little check to see if everything's good:
```console
$ ls -l trickyty
-rwsr-xr-x 1 root users 6894 11 sept. 22:05 trickyty
```
See the `s` in the permissions? It's the setuid bit.

Time to execute our program!
```console
$ ./trickyty
# whoami
root
```
Yes, we are root now!

Note that if you put your program on a removable drive and plug it in another computer, it won't work if said drive is mounted with the `nosuid` option.
