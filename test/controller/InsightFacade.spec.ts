import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {InsightDatasetKind, InsightError} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe("InsightFacade", function()  {
    let sections: string;
    let facade: InsightFacade;

    before(function() {
        sections = getContentFromArchives("pair.zip");
    });

    beforeEach(function() {
         clearDisk()
         facade = new InsightFacade();
    });

    describe("addDataset", function() {

        it ("should reject with  an empty dataset id", function() {
            const result = facade.addDataset("", sections, InsightDatasetKind.Sections)

            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });

        /*it ("should reject same name", function(){
            facade.addDataset("aaa", sections, InsightDatasetKind.Sections)
                .then((res) => {
                    facade.addDataset("aaa", sections, InsightDatasetKind.Sections)
                })
                //shouldn't go to this then?
                .then((res) =>{
                    expect
                })
                .catch((err) => {


            });
        });
        */


        it("Should resolve with a correct dataset", function() {
            return facade.addDataset("Course", sections, InsightDatasetKind.Sections)
                .then((res) => {
                    //result should be the name of the id
                    expect(res).to.deep.equal(["Course"]);
                    //should be an array
                    expect(res).to.be.an.instanceof(Array);
                    //length should be 1 (only added 1 dataset)
                    expect(res.length).to.equal(1);
                    })
                .catch((error) => {
                    expect.fail("shouldn't end up here")

            });
        });
    });
});