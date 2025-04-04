---
title: "Transliteration fonts"
date: 2025-03-24T20:04:57+01:00
locale: "en"
tags: []
license: "CC-BY-4.0"
---
Last summer, I went on a vacation to Greece. I wanted to read directions and order in Greek, which meant that I needed to know the alphabet. Alas, my middle school Greek classes are far behind me and there isn't much left of it in my memory. So trained with ChatGPT by transliterating random Greek words, and eventually reached basic proficiency.

But during my trip, I thought of a better way. What if all latin characters on my phone were replaced with Greek characters? Surely, that would be the way to learn effortlessly!

I set that idea aside in a corner of my head until I was invited to Greece again, for a wedding. And so I started coding. After tens of hours of development (instead of a few hours of training), here is the result: [`transliteration-fonts`](https://github.com/getkey/transliteration-fonts)!

## The tools

I'm using [fontTools](https://fonttools.readthedocs.io/en/latest/). This is a Python library that allows editing TrueType/OpenType fonts. It's not the easiest to use, so initially, I was using [FontForge](https://fontforge.org) instead. Unfortunately, FontForge is slow and is limited to its own format, and thus, there weren't as many fonts that I could modify. `fontTools` can modify any `.ttf` or `.otf` file!

In particular, I wanted to be able to modify the [Noto](https://en.wikipedia.org/wiki/Noto_fonts) family of fonts, as they have both a huge coverage of Unicode, and are open source. This is important because I want to be able to redistribute them.

## The GSUB table

Fonts in the TrueType/OpenType format have a table for character substitution. This is called the [GSUB table](https://learn.microsoft.com/en-us/typography/opentype/spec/gsub). There are many types of substitutions:

## Single substitutions

This is the simplest substitution type. With it, you can map one character to another. For example, you can say that all `a` should turn into `α`.

```
The quick brown fox jumps over the lazy dog
Τηε quιcκ βροwν fοξ juμπς οvερ τηε λαzυ δογ
```

I want the transliteration to go both ways (`a` → `α` and `α` → `a`). But if you do that, you create an infinite loop. `a` → `α` → `a` → `α` → ...and so on and so on. When using such a font, the software didn't crash but it ignored the substitution.

### Script/language

Thankfully, there is a way around it. When you define a substitution, you can specify the _script_ (and the language). Which amounts to saying, text in latin script containing `a` will show as `α`. And text in greek script containing `α` will show as `a`. We avoid the infinite loop.

Don't ask me how font renderers implement that. Mere mortals should stay away from such dark magic.

Some characters are used in multiple scripts, with different meanings. One such example is `;`, a semicolon in latin and a question mark in greek. So when we write a `;` and the surrounding text is in the greek alphabet, we want to transcribe it to `?` in latin. But if we see a `;` and the surrounding text is in the latin alphabet, that corresponds to `·` in greek.

```
Guess what; you don't know?
Γuεσς whατ· υοu δον'τ κνοw;

Μάντεπσε τι· δεν ξέρεις;
Mántepse ti; den xéreis?
```

### Swapping characters

When I started working on this, I didn't know much about font formats. So instead of using a table, I naively swapped them hard (by changing its Unicode value). It doesn't work in the edge case described above, instead producing:

```
Guess what; you don't know?
Γuεσς whατ? υοu δον'τ κνοw·
```

Anyway, swapping Unicode values won't get you very far, for proper transliteration you need more advanced substitutions such as ligatures, and for those a table is the only way.

## Ligatures and multiple substitutions

[Ligatures](https://en.wikipedia.org/wiki/Ligature_(writing)) are the best-known kind of substitution. Most fonts have them, to make the text look better, for example by removing the dot on the `i` when it is next to a `f`. Ligatures will turn 2 characters (or more) like `f` and `i` into a single character like `ﬁ`.

We are going to hack ligatures, because there are cases where a letter in greek turns to a digraph in latin. `Digraph`? That's actually an example: `ph` needs to become `φ`.

```
Digraph
Διγραφ
```

And the opposite is called _multiple substitution_, where a single character like `φ` becomes multiple characters like `ph`.

```
Φιλοσοφία
Philosophía
```

Taking our example from before:

```
The quick brown fox jumps over the lazy dog
Θε quιcκ βροwν fοξ juμφ οvερ θε λαzυ δογ
```

## Multiple to multiple substitutions

There is a last type of substitution we haven't covered, multiple character to multiple characters. For example, in [Kunrei-shiki](https://en.wikipedia.org/wiki/Kunrei-shiki_romanization), `きゃ` becomes `kya`.

Unfortunately, TrueType/OpenType doesn't have support for this kind of substitution.

But there is a hack. You can make a dummy glyph! Then you split your substitution in two pieces:

```
きゃ → single_dummy_glyph
single_dummy_glyph → kya
```

And just like that, I turned a multiple to multiple substitution into a ligature and a single to multiple substitution!

## Contextual substitutions

In greek, `σ` in word-final position becomes `ς`.

```
Σοφιστής
Sophistḗs
```

In other words, the character depends on the _context_. And you make this work with [contextual substitutions](https://glyphsapp.com/learn/features-part-2-contextual-substitutions).

For all other types of substitution, I have a simple `.tsv` file that maps characters to other characters. This is too simple for contextual substitutions. But since in greek, only one character is affected, I decided not to bother with that feature.

## Feature tag

When you define a substitution, you have to give it a _feature tag_. This defines the context into which that substitution should happen. There are [a lot](https://learn.microsoft.com/en-us/typography/opentype/spec/featuretags) of feature tags.

Feature tags help the software rendering the font in making good decisions.

For example, `rand` indicates that a character must be randomly substituted with the character defined in the table. This is useful for handwriting fonts where you want characters to have a bit of variation. If the software disregards `rand`, the text will look off, but still readable.

`calt` indicates contextual alternates, which is another, equivalent version of a character. Graphic designers like having the option to pick a different character than the default.

`ccmp` is the one I use. It means something like "this substitution is very important and should always be applied".

## Playground

Do you want to try this out for yourself? I've created a playground below. You can also [download the fonts](https://github.com/getkey/transliteration-fonts/releases) from GitHub.

<style>
	@font-face {
		font-family: Apeleutherosis;
		src: url('./ApeleutherosisSerif-Regular.woff2');
	}
	@font-face {
		font-family: Osvobozdenie;
		src: url('./OsvobozdenieSerif-Regular.woff2');
	}
	textarea {
		width: 100%;
		height: 15ch;
		font-family: serif;
	}
	#apeleutherosis:checked ~ .playground {
		font-family: Apeleutherosis;
	}
	#osvobozdenie:checked ~ .playground {
		font-family: Osvobozdenie;
	}
</style>

<form>
<input type="radio" name="font" id="apeleutherosis" checked/>
<label for="apeleutherosis">latin ↔ greek</label>

<input type="radio" name="font" id="osvobozdenie"/>
<label for="osvobozdenie">latin ↔ cyrilic</label>

<input type="radio" name="font" id="default"/>
<label for="default">Default</label>

<textarea class="playground" placeholder="Write some text here..."></textarea>
</form>
