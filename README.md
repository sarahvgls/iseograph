## Execute performance test by running

```bash
cd frontend
pnpm exec tsx src/evaluation/performance-test.ts 
```

Debug mode can be enabled:

```bash
PWDEBUG=1 pnpm exec tsx src/evaluation/performance-test.ts 
```

Results are saved in `frontend/src/evaluation/downloads/performance_data.csv`.

### Random proteins

All reviewed proteins have been downloaded from UniProt on 27th of August 2025. The file can be found at
`frontend/src/evaluation/uniprotkb_AND_reviewed_true_2025_08_27.list`.

All reviewed proteins with annotated variants and isoforms have been downloaded from UniProt on 26th of August 2025. The
file can be found at `uniprotkb_ft_positional_VAR_SEQ_2025_08_26.list`