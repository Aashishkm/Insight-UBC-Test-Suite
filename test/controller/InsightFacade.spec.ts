import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {
    InsightDatasetKind,
    InsightError,
    InsightResult,
    NotFoundError,
    ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import {folderTest} from "@ubccpsc310/folder-test";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe("InsightFacade", function()  {
    let sections: string;
    let facade: InsightFacade;

    before(function() {
        clearDisk()
        facade = new InsightFacade();
        sections = getContentFromArchives("pair.zip");
    });

    describe("addDataset", function() {

        it ("should reject with  an empty dataset id", function() {
            const result = facade.addDataset("", sections, InsightDatasetKind.Sections)

            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it ("should reject same name", function(){
             const result = facade.addDataset("aaa", sections, InsightDatasetKind.Sections)
                .then(() => {
                    return facade.addDataset("aaa", sections, InsightDatasetKind.Sections)
                })
                return expect(result).to.eventually.be.rejectedWith(InsightError);
        });


        it("should reject name with underscore", function() {
            const result = facade.addDataset("a_b", sections, InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject name with only whitespace", function() {
            const result = facade.addDataset("  ", sections, InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject content that is not a zip file without courses folder", function() {
            const result = facade.addDataset("nonzip", "Randomstringggg", InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject an empty zip file", function() {
            let empty: string;
            empty = getContentFromArchives("empty.zip");
            const result = facade.addDataset("empty-zip", empty, InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject an empty zip file with a courses folder", function() {
            let empty2: string;
            empty2 = getContentFromArchives("emptywithcourses.zip");
            const result = facade.addDataset("empty-zip", empty2, InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject the wrong InsightDatasetKind ", function() {

            const result = facade.addDataset("wrongdatasetkind", sections, InsightDatasetKind.Rooms)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject a dataset with invalidJSON", function() {
            let bad: string;
            bad = getContentFromArchives("badjson.zip");

            const result = facade.addDataset("badjson", bad, InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it("should reject a dataset with no sections", function() {
            let nosections: string;
            nosections = getContentFromArchives("Nosections.zip");
            const result = facade.addDataset("nosections", nosections, InsightDatasetKind.Sections)
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });


        it("Should resolve with a correct dataset", function() {
            return facade.addDataset("testing", sections, InsightDatasetKind.Sections)
                .then((result) => {
                    //result should be the name of the id
                    expect(result).to.deep.equal(["testing"]);
                    //should be an array
                    expect(result).to.be.an.instanceof(Array);
                    //length should be 1 (only added 1 dataset)
                    expect(result.length).to.equal(1);
                    })
                .catch((error) => {
                    expect.fail("shouldn't end up here")

            });
        });

    });

    describe("removeDataset", function() {
        before(function() {
            clearDisk()
            facade = new InsightFacade();
        });

        it ("should reject a dataset id that is empty", function() {
            const result = facade.removeDataset("")
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it ("should reject a dataset with an underscore", function() {
            const result = facade.removeDataset("a_b")
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it ("should reject a dataset with only whitespace", function() {
            const result = facade.removeDataset(" ")
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        it ("should reject a dataset that doesn't exist", function() {
            const result = facade.removeDataset("random")
            return expect(result).to.eventually.be.rejectedWith(NotFoundError);
        });


        it ("should successfully remove a dataset that is already added", function() {
            return facade.addDataset("ab", sections, InsightDatasetKind.Sections)
                .then((result) => {
                    expect(result).to.deep.equal(["ab"]);
                    return facade.removeDataset("ab");
                })
                .then((res) => {
                    //check assertion for string
                    expect(res).to.equal("ab");
                })
                .catch((error) => {
                    expect.fail("should have accepted!")
                });
        });

    });

    describe("listDataset", function() {

        before(function() {
            clearDisk()
            facade = new InsightFacade();
        });

        it("should list an empty dataset", async function() {
            const dataset = await facade.listDatasets()
            expect(dataset).to.deep.equal([])


        });

        it("should list a dataset with stuff in it", async function() {
            await facade.addDataset("ab", sections, InsightDatasetKind.Sections)

            const dataset = await facade.listDatasets();

            expect(dataset).to.deep.equal([{id: "ab", kind: InsightDatasetKind.Sections, numRows: 64612}])
        });
    });

    describe("performQuery", function() {

        before(function() {

            clearDisk()
            facade = new InsightFacade();

            const dataset1 = facade.addDataset("sections", sections, InsightDatasetKind.Sections)
            return expect(dataset1).to.eventually.deep.equal(["sections"])

            const dataset2 = facade.addDataset("sections2", sections, InsightDatasetKind.Sections)
            return expect(dataset2).to.eventually.deep.equal(["sections2"])

        });

        type Error = "InsightError" | "ResultTooLargeError";

        function errorValidator(error: any): error is Error {
            return error === "InsightError" || error === "ResultTooLargeError"
        }

        function assertOnError(actual: any, expected: Error): void {
            if (expected === "InsightError") {
                expect(actual).to.be.instanceof(InsightError);
            } else if (expected === "ResultTooLargeError") {
                expect(actual).to.be.instanceof(ResultTooLargeError);
            } else {
                // this should be unreachable
                expect.fail("UNEXPECTED ERROR");
            }
        }
        function assertOnResult(actual: unknown, expected: Promise<InsightResult[]>): void {
            expect(actual).to.equal(expected);
        }

        function target(input: unknown): Promise<InsightResult[]> {
            return facade.performQuery(input);
        }

        folderTest<unknown, Promise<InsightResult[]>, Error>(
            "Dynamic Tests Perform Query",
            target,
            "./test/resources/queries",
            {
                errorValidator,
                assertOnError,
                assertOnResult
            }
        )

    });
});