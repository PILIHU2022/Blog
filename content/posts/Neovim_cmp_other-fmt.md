---
title: Neovim使用`conform.nvim`或`none-ls.nvim`实现格式化代码
date: 2024-10-02 15:00:00
tags: [ Linux, Neovim ]
categories: Arch Linux
---
# 该配置由ChatGPT完成，经笔者修改测试后完全可用(注释可以不看)
# `Conform.nvim`
> Lightweight yet powerful formatter plugin for Neovim
> (轻量但强大的Neovim代码格式化插件)
> —— [GitHub描述](https://github.com/stevearc/conform.nvim)
## 开始使用
首先，先安装`conform.nvim`
```lua
return {
    {
        "stevearc/conform.nvim", -- 安装插件
        config = function()
            -- 配置conform，使用black和isort格式化Python
            require("conform").setup({
                formatters_by_ft = {
                    -- python = { "black" },
                    python = { "black" },
                    lua = { 'lua-ls' },
                },
            })

            -- 自动格式化配置
            -- vim.api.nvim_create_autocmd("BufWritePre", {
            --     pattern = "*.py",
            --     callback = function(args)
            --         require("conform").format({ bufnr = args.buf })
            --     end,
            -- })
        end,
    }
}

```
然后保存，重新进入Neovim就可以看见`lazy.nvim`正在安装了。
### 安装代码格式化工具
以`Python`为例
```
# Arch Linux
sudo pacman -S python-black
```
来安装`black`。你也可以用`isort`等\
`formatters_by_ft`是一个列表，你可以添加你所用编程语言的格式化工具，如
```lua
formatters_by_ft = {
    bash = { 'beautysh' },
}
```
关于格式化工具，你可以查看：\
[Conform文档](https://github.com/stevearc/conform.nvim?tab=readme-ov-file#formatters)\
或通过在Neovim中使用`:help conform-formatters`来查看
## 格式化代码
你只需要使用`:lua require("conform").format()`的命令来进行代码格式化。
## 关于保存时自动格式化，请看[保存时自动格式化代码](/content/posts/Neovim_cmp_other-fmt.md#保存时自动格式化代码)
# 使用`none-ls.nvim`
> null-ls.nvim reloaded / Use Neovim as a language server to inject LSP diagnostics, code actions, and more via Lua. 
> (继承null-ls.nvim/通过Lua使用Neovim作为一个语言服务器来注入LSP诊断，代码动作等等)
> —— [GitHub描述](https://github.com/nvimtools/none-ls.nvim/)
## 开始使用
首先，安装`none-ls.nvim`
```lua
return {
    {
        "nvimtools/none-ls.nvim",  -- 安装none-ls.nvim插件
        dependencies = { "nvim-lua/plenary.nvim" },  -- 依赖plenary.nvim
        config = function()
            local none_ls = require("null-ls")

            -- 配置none-ls，集成black
            none_ls.setup({
                sources = {
                    none_ls.builtins.formatting.black,
                },
            })

            -- 自动格式化配置
            vim.cmd [[
                augroup LspFormatting
                    autocmd! * <buffer>
                    autocmd BufWritePre *.py lua vim.lsp.buf.format()
                augroup END
            ]]
        end,
    }
}

```
然后保存，重新进入Neovim就可以看见lazy.nvim正在安装了。
### 安装代码格式化工具
以`Python`为例
```
# Arch Linux
sudo pacman -S python-black
```
来安装`black`。你也可以用`isort`等\
`sources`是一个列表，你可以添加你所用编程语言的格式化工具，如
```lua
sources = {
    null_ls.builtins.formatting.stylua,
}
```
关于格式化工具，你可以查看：\
[none-ls文档-内置源](https://github.com/nvimtools/none-ls.nvim/blob/main/doc/BUILTINS.md)
## 格式化代码
你只需要使用`:lua vim.lsp.buf.format()`的命令来进行代码格式化。
## 关于保存时自动格式化，请看[保存时自动格式化代码](/content/posts/Neovim_cmp_other-fmt.md#保存时自动格式化代码)
# 保存时自动格式化代码
## `conform.nvim`
使用该代码：
```lua
return {
    {
        "stevearc/conform.nvim", -- 安装插件
        config = function()
            -- 配置conform，使用black和isort格式化Python
            require("conform").setup({
                formatters_by_ft = {
                    -- python = { "black" },
                    python = { "black" },
                    lua = { 'lua-ls' },
                },
            })

            -- 自动格式化配置
            vim.api.nvim_create_autocmd("BufWritePre", {
                pattern = "*.py",
                callback = function(args)
                    require("conform").format({ bufnr = args.buf })
                end,
            })
        end,
    }
}
```
## `none-ls.nvim`
使用以下代码：
```lua
return {
    {
        "nvimtools/none-ls.nvim",  -- 安装none-ls.nvim插件
        dependencies = { "nvim-lua/plenary.nvim" },  -- 依赖plenary.nvim
        config = function()
            local none_ls = require("null-ls")

            -- 配置none-ls，集成black
            none_ls.setup({
                sources = {
                    none_ls.builtins.formatting.black,
                },
            })

            -- 自动格式化配置
            vim.cmd [[
                augroup LspFormatting
                    autocmd! * <buffer>
                    autocmd BufWritePre *.py lua vim.lsp.buf.format()
                augroup END
            ]]
        end,
    }
}

```
两个切记不能同时开启！因为可能会返回不同的结果（当然使用相同的格式化工具就不会）。但是会增加占用（富哥当我没说:(）。所以建议二选一即可
