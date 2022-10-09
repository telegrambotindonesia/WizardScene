Documentation for WizardScene

---

Building docs :

1. Clone the main branch and gh-pages branch.
2. Make sure you use the `yarn berry` version.
3. Make sure you using the `latest` typescript version.
4. In main branch, open `index.ts` file, remove two variable (`Scene` and `Stage`), change all the `_scene` with `Scene` `_stage` with `Stage`, and export all type,class which is in the file.
5. Generate docs using `yarn typedocs`
6. On gh-pages branch, change `docs` route with new generated content from typedocs.
7. Do commit and push the gh-pages branch. don't push main branch!!
