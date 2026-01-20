import { plugin } from "bun";
import { compile, compileModule } from "svelte/compiler";

plugin({
    name: "svelte",
    setup(build) {
        build.onLoad({ filter: /\.svelte(\.[jt]s)?$/ }, async (args) => {
            const content = await Bun.file(args.path).text();
            const isModule = args.path.endsWith('.js') || args.path.endsWith('.ts');

            try {
                let result;
                if (isModule) {
                    result = compileModule(content, {
                        filename: args.path,
                        generate: "client",
                        dev: true,
                    });
                } else {
                    result = compile(content, {
                        filename: args.path,
                        generate: "client",
                        dev: true, // improved checking and warnings
                    });
                }

                return {
                    contents: result.js.code,
                    loader: "js",
                };
            } catch (err) {
                console.error(`Error compiling ${args.path}:`, err);
                throw err;
            }
        });

    },
});
