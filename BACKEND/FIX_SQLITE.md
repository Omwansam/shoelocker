# Fix: ModuleNotFoundError: No module named '_sqlite3'

Your Python 3.8.20 (pyenv) was built **without SQLite support** because the SQLite development libraries were missing during compilation.

## Steps to Fix

### 1. Install SQLite development libraries

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y libsqlite3-dev
```

**Fedora/RHEL:**
```bash
sudo dnf install sqlite-devel
```

**Arch Linux:**
```bash
sudo pacman -S sqlite
```

### 2. Reinstall Python 3.8.20 with pyenv

```bash
pyenv uninstall 3.8.20
pyenv install 3.8.20
```

### 3. Recreate your virtual environment

Since the virtualenv was created with the old Python, recreate it:

```bash
cd /home/omwansa/Development/Furniture-system/BACKEND
pipenv --rm
pipenv install
```

### 4. Run Flask again

```bash
cd /home/omwansa/Development/Furniture-system/BACKEND/server
pipenv run flask run
```

---

## Alternative: Use another Python version

If you have another Python version (e.g. 3.9, 3.10) that was built with SQLite:

```bash
pyenv install 3.10.0   # or another version
cd /home/omwansa/Development/Furniture-system/BACKEND
pipenv --rm
pipenv --python 3.10.0
pipenv install
```
