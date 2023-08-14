import * as path from "path";
import { rules } from ".";
import * as tsParser from "@typescript-eslint/parser";
import { Linter } from "eslint";
// @ts-ignore This isn't typed yet.
import { FlatRuleTester } from "eslint/use-at-your-own-risk";

// We'll always run our rules inside a faux TypeScript project so that we get typechecking.
const cfg: Linter.FlatConfig = {
  languageOptions: {
    // @ts-ignore This is currently typed for the old config format.
    parser: tsParser,
    parserOptions: {
      tsconfigRootDir: path.join(__dirname, ".."),
      project: "./tsconfig.tests.json",
      sourceType: "script",
    },
  },
};

const ruleTester = new FlatRuleTester(cfg);

ruleTester.run(
  "require-object-type-annotations",
  rules["require-object-type-annotations"],
  {
    valid: [
      {
        code: `
        const x = {};
      `,
      },
      {
        code: `
        const x = {
          // comment
        };
      `,
      },
      {
        code: `
        const x: {} = { prop: 1 };
      `,
      },
      {
        code: `
        const x: object = { prop: 1 };
      `,
      },
      {
        code: `
        const x: { prop: number } = { prop: 1 };
      `,
      },
      {
        code: `
        const x = { prop: 1 } satisfies { prop: number };
      `,
      },
      {
        code: `
        const x: { [key: string]: any } = { prop: { prop: 1 } };
      `,
      },
      {
        code: `
        const x: { [key: string]: unknown } = { prop: { prop: 1 } };
      `,
      },
      {
        code: `
        const xs: Array<{ prop: number }> = [{ prop: 1 }];
      `,
      },
      {
        code: `
        const fn: () => { prop: number } = () => ({ prop: 1 });
      `,
      },
      {
        code: `
        const fn = (): { prop: number } => ({ prop: 1 });
      `,
      },
      {
        code: `
        declare const f: (x: { prop: number }) => unknown;
        f({ prop: 1 });
      `,
      },
      {
        code: `
        declare const f: { g: (x: { prop: number }) => unknown };
        f.g({ prop: 1 });
      `,
      },
      {
        code: `
        declare const f: <T>(x: { [key: string]: T }) => T;
        f({ prop: 1 });
      `,
      },
      {
        code: `
        declare const mk: <T>() => (t: T) => unknown;
        const f = mk<{ prop: number }>();
        f({ prop: 1 });
      `,
      },
      {
        code: `
        declare const f: (arg: () => { prop: number }) => unknown;
        f(() => ({ prop: 1 }));
      `,
      },
      {
        code: `
        import * as Sum from '@unsplash/sum-types';

        type MyType = Sum.Member<'MyMember', { prop: number }>;
        const MyType = Sum.create<MyType>();

        MyType.mk.MyMember({ prop: 1 });
      `,
      },
      {
        options: [{ ignoreInsideFunctionCalls: "^t\\.type$" }],
        code: `
        import * as t from 'io-ts';
        const x = t.type({ prop: 1 });
      `,
      },
      {
        options: [{ ignoreInsideFunctionCalls: "^t\\.type$" }],
        code: `
        import * as t from 'io-ts';
        const x = t
          // comment
          .type({ prop: t.number });
      `,
      },
      {
        code: `
        import * as Sum from "@unsplash/sum-types";

        type U = Sum.Member<"A">;
        const { match } = Sum.create<U>();
        match({
            A: () => 1,
        });
      `,
      },
      {
        options: [{ ignoreInsideFunctionCalls: "^matchW$" }],
        code: `
        import * as Sum from "@unsplash/sum-types";

        type U = Sum.Member<"A">;
        const { matchW } = Sum.create<U>();
        matchW({
            A: () => 1,
        });
      `,
      },
      {
        options: [{ ignoreInsideFunctionCalls: "^.+\\.matchW$" }],
        code: `
        import * as Sum from "@unsplash/sum-types";

        type U = Sum.Member<"A">;
        const U = Sum.create<U>();
        U.matchW({
            A: () => 1,
        });
      `,
      },
      {
        options: [
          { ignoreInsideFunctionCalls: "^.+\\.getCodecFromSerialized$" },
        ],
        code: `
        import * as t from "io-ts";
        import * as Sum from "@unsplash/sum-types";
        import * as SumIoTs from "@unsplash/sum-types-io-ts";

        type U = Sum.Member<"A", string>;
        Sum.create<U>();
        SumIoTs.getCodecFromSerialized<U>()({ A: t.string });
      `,
      },
      {
        code: `
        interface Base {}

        type MyType = Base & {
          prop: string;
        };

        interface A extends MyType {}
        interface B extends MyType {}

        type Union = A | B;

        declare const union: Union;
        const v: MyType = { ...union };
      `,
      },
      {
        code: `
        declare const f: (x: unknown) => unknown;
        f({ prop: 1 });
      `,
      },
      {
        code: `
        [1, 2, 3].map((id): { prop: number } => ({ prop: id }));
      `,
      },
      {
        code: `
        // eslint-disable-next-line rule-to-test/require-object-type-annotations
        const obj = { prop: 1 };

        declare const f: (t: typeof obj) => unknown;

        f({ prop: 1 });
      `,
      },
      // This test should pass but it doesn't due to a bug. Until this bug has been fixed, this test
      // is skipped. Once we fix the bug we can uncomment this test.
      // {
      //   code: `
      //     import * as P from 'fp-ts-routing';
      //     import { pipe } from 'fp-ts/function';

      //     pipe(
      //       P.str('id'),
      //       P.imap(
      //         ({ id }): { id2: string } => ({ id2: id }),
      //         ({ id2 }) => ({ id: id2 }),
      //       ),
      //     );
      //   `,
      // },
    ],
    invalid: [
      {
        code: `
        const x = { prop: 1 };
      `,
        errors: [{ messageId: "forbidden" }],
      },
      // Should report error for outer object but not inner object.
      {
        code: `
        const x = { prop: { prop: 1 } };
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        const xs = [{ prop: 1 }];
      `,
        errors: [{ messageId: "forbidden" }],
      },
      // Should report error for outer object but not inner object.
      {
        code: `
        const xs = { ys: [{ prop: 1 }] };
      `,
        errors: [{ messageId: "forbidden" }],
      },
      // Should report error for both outer object and inner object.
      {
        code: `
        const x = {
          prop: () => {
            const y = { prop: 1 };
            return y;
          },
        };
      `,
        errors: [{ messageId: "forbidden" }, { messageId: "forbidden" }],
      },
      // Should report error for outer object but not inner object.
      {
        code: `
        const x = {
          prop: () => ({ prop: 1 }),
        };
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        const fn = () => ({ prop: 1 });
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        const fn = () => ({ prop: 1 });
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        declare const f: <T>(x: T) => T;
        f({ prop: 1 });
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        declare const f: <T>(x: T) => T;
        const x: { prop: number } = f({ prop: 1 });
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        declare const f: <T extends { prop: 1 }>(x: T) => T;
        f({ prop: 1 });
      `,
        errors: [{ messageId: "forbidden" }],
      },
      // Should report error for inner object but not outer object.
      {
        code: `
        declare const f: <T>(x: { [key: string]: T }) => T;
        f({ prop: { prop: 1 } });
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        [1, 2, 3].map(id => ({ prop: id }));
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        declare function pipe<A, B>(a: A, ab: (a: A) => B): B;

        declare const logName: (user: User) => void;
        type User = { name: string };

        pipe({ name: "foo" }, logName);
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        const apply =
            <T,>(t: T) =>
            (f: (t: T) => unknown) =>
                f(t);

        declare const logName: (user: User) => void;
        type User = { name: string };

        apply({ name: "foo" })(logName);
      `,
        errors: [{ messageId: "forbidden" }],
      },
      {
        code: `
        declare const x: { [index: string]: string };
        const y = { ...x }
      `,
        errors: [{ messageId: "forbidden" }],
      },
      // These tests should fail but they don't due to bugs. Until these bugs have been fixed, these tests
      // are skipped.
      // {
      //   code: `
      //     declare const f: <T>(t: T) => T;

      //     const x: Array<{ name: 'a' | 'b' }> = f([{ name: 'a' }, { name: 'b' }]);
      //   `,
      //   errors: [{ messageId: 'forbidden' }],
      // },
      // {
      //   code: `
      //     declare const f: <T>(x: T, y: T) => T;
      //     f({ prop: 1 }, undefined);
      //   `,
      //   errors: [{ messageId: 'forbidden' }],
      // },
    ],
  }
);
