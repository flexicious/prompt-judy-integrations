import { callLLM } from "./call-llm";
import { getRowsFromSqlite } from "./sqlite";

const mappingCache = new Map<string, string>();
export const evaluateResponse = async ({
  expectedResponse,
  actualResponse,
}: {
  expectedResponse: string;
  actualResponse: string;
}) => {
  if (!expectedResponse || !actualResponse) {
    return {
      score: 0,
      scoreDetails: `Expected response or actual response is missing`,
    };
  }
  if (expectedResponse == "Not Allowed") {
    const score = actualResponse.trim() == "Not Allowed" ? 100 : 0;
    return {
      score: score,
      scoreDetails: score == 100 ? "" : `Actual response was ${actualResponse}`,
    };
  }
  if (expectedResponse === "Not Possible") {
    const score = actualResponse.trim() === "Not Possible" ? 100 : 0;
    return {
      score: score,
      scoreDetails: score == 100 ? "" : `Actual response was ${actualResponse}`,
    };
  }

  const expectedResult = await getRowsFromSqlite(expectedResponse, [])
  const actualResult = await getRowsFromSqlite(actualResponse, []);
  if (expectedResult.length !== actualResult.length) {
    return {
      score: 0,
      scoreDetails: `Expected result length ${expectedResult.length} does not match actual result length ${actualResult.length}`,
    };
  }
  if (expectedResult.length === 0 && actualResult.length === 0) {
    return {
      score: 100,
      scoreDetails: `Both arrays are empty`,
    };
  }
  //if the result is a single row with a single column, we can compare the values directly
  if (expectedResult.length === 1 && actualResult.length === 1 && Object.keys(expectedResult[0]).length === 1 && Object.keys(actualResult[0]).length === 1) {
    let expectedValue = expectedResult[0][Object.keys(expectedResult[0])[0]];
    let actualValue = actualResult[0][Object.keys(actualResult[0])[0]];
    //if they are both numbers greater than 1, round to 2 decimal places
    if (typeof expectedValue === "number" && typeof actualValue === "number" && expectedValue > 1 && actualValue > 1) {
      expectedValue = expectedValue.toFixed(2);
      actualValue = actualValue.toFixed(2);
    }
    const score = expectedValue === actualValue ? 100 : 0;
    return {
      score: score,
      scoreDetails: `Expected value ${expectedValue} matches actual value ${actualValue}`,
    };
  }


  return {
    score: 100,
    scoreDetails: `Expected result length ${expectedResult.length} matches actual result length ${actualResult.length}`,
  }
  // Uncomment below if you want to introspect the objects in detail.

  // const prompt = `You are an AI trying to determine two arrays of objects represent the same data.
  // Array 1 has Objects with the following keys: ${Object.keys(expectedResult[0]).join(", ")}
  // Array 2 has Objects with the following keys: ${Object.keys(actualResult[0]).join(", ")}
  // To compare these objects, first we need to sort the objects in each array by the keys,
  // then we need a mapping between the keys of the two arrays to determine if the values are the same.
  // So, please return a JSON object with the following keys:
  // {
  //   "sortKey1": "The key to sort the first array by",
  //   "sortKey2": "The key to sort the second array by",
  //   "mapping": {
  //     "key1": "key2",
  //     "key2": "key1",
  //     ... //a mapping between the keys of the two arrays
  //   }
  // }
  // You must return a valid JSON object.
  // `
  // let mapping = await getMapping(prompt) as string;
  // mapping = mapping.replace(/\n/g, "");
  // mapping = mapping.substring(mapping.indexOf("{"), mapping.lastIndexOf("}") + 1);
  // const parsedMapping = JSON.parse(mapping);
  // return compareArrays(expectedResult as Record<string, unknown>[], actualResult as Record<string, unknown>[], parsedMapping);
};

// const getMapping = async (prompt: string) => {
//   const cachedMapping = mappingCache.get(prompt);
//   if (cachedMapping) {
//     return cachedMapping;
//   }
//   const response = await callLLM({ prompt, model: "gemini-2.0-flash-exp", configuration: { temperature: 0, maxTokens: 1024 } });
//   mappingCache.set(prompt, response.content as string);
//   return response.content as string;
// }

// export const compareArrays = (expectedResult: Record<string, unknown>[], actualResult: Record<string, unknown>[], mapping: Mapping) => {
//   const sortedExpectedResult = sortArrayByKey(expectedResult, mapping.sortKey1);
//   const sortedActualResult = sortArrayByKey(actualResult, mapping.sortKey2);

//   //first ensure the arrays are the same length
//   if (sortedExpectedResult.length !== sortedActualResult.length) {
//     return {
//       score: 0,
//       scoreDetails: `Expected result length ${sortedExpectedResult.length} does not match actual result length ${sortedActualResult.length}`,
//     };
//   }
//   const mappingKeys = Object.entries(mapping.mapping);
//   for (let i = 0; i < sortedExpectedResult.length; i++) {
//     for (const [key1, key2] of mappingKeys) {
//       if (sortedExpectedResult[i][key1] !== sortedActualResult[i][key2]) {
//         return {
//           score: 0,
//           scoreDetails: `Expected result ${sortedExpectedResult[i][key1]} does not match actual result ${sortedActualResult[i][key2]}  - Expected Object: ${JSON.stringify(sortedExpectedResult[i])} Actual Object: ${JSON.stringify(sortedActualResult[i])}`,
//         };
//       }
//     }
//   }
//   return {
//     score: 100,
//     scoreDetails: `All objects match`,
//   };
//   //then ensure the keys are the same

// }
// const sortArrayByKey = (array: Record<string, unknown>[], key: string) => {
//   return array.sort((a, b) => a[key as keyof typeof a] === b[key as keyof typeof b] ? 0 : a[key as keyof typeof a] < b[key as keyof typeof b] ? -1 : 1);
// }
// export interface Mapping {
//   sortKey1: string;
//   sortKey2: string;
//   mapping: Record<string, string>;
// }
