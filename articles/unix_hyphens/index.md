# Hyphens in UNIX's filenames

Today I discovered an interesting UNIX design flaw. UNIX deals badly with files  starting with `-`. Let's mess around!

Warning: do like me, create  a new directory and `cd` into it.
```console
$ mkdir tests && cd tests
$ touch -r
touch: usage: touch [-alm] [-t time_t] <file>
```
Okay, so I can't create a file starting with a `-`, because `touch` thinks it's an argument. There are several ways around to create this file:

* ```console
$ touch ./-r
```
Here you give it a path, so that the first argument `touch` gets is not a `-`. The path here (`./`) is a relative path, it's the directory I'm currently in.
That's the best method, but there are others.

* ```console
$ touch -- -r
```
Some touch implementations allow the user to write `--` between the options and the filename. This method doesn't work everywhere, not with BusyBox for example, that's why I prefer the method above.

* ```console
$ touch r
$ mv r -r
```
This also works.

Okay, whatever the reason to create that file is, I finally have it. Yay!
Create a directory, we'll see after why.

```console
$ mkdir tre
$ ls -l
----rwxr-x system   sdcard_rw        0 2014-08-03 15:22 -r
d---rwxr-x system   sdcard_rw          2014-08-03 15:22 tre
```

Everything's there, that's cool, but now I want to delete everything in the directory, except subdirectories.

```console
$ rm *
$ ls -l
----rwxr-x system   sdcard_rw        0 2014-08-03 15:22 -r
```

Wait, what ? `-r` should have been deleted, not the directory `tre`!
In fact, when I run that command, the shell transforms `*` into the list of files in the directory, then gives it to the program. In that case, there's one file: `-r`, but the program `rm` has no way of knowing that `-r` is a file, not an argument. And even if you have other files in your directory, filenames starting with `-` always are first in the list of arguments, that's standard.

It's the end of this article, let's delete that file!

```console
$ rm -r
$ ls
-r
```

Oh...
Yes, method for creating and deleting that kind of files are the same, obviously this doesn't work. But now it shouldn't be hard for you to delete it, right?