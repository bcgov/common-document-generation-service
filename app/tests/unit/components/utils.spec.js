const config = require('config');
const log = require('npmlog');

const utils = require('../../../src/components/utils');

log.level = config.get('server.logLevel');

describe('prettyStringify', () => {
  const obj = {
    foo: 'bar'
  };

  it('should return a formatted json string with 2 space indent', () => {
    const result = utils.prettyStringify(obj);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n  "foo": "bar"\n}');
  });

  it('should return a formatted json string with 4 space indent', () => {
    const result = utils.prettyStringify(obj, 4);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n    "foo": "bar"\n}');
  });
});

describe('getFileExtension', () => {
  it('should return a the file extension when there is one', () => {
    expect(utils.getFileExtension('abc_123.docx')).toEqual('docx');
    expect(utils.getFileExtension('my file name here.docx')).toEqual('docx');
    expect(utils.getFileExtension('file.name.with.dots.docx')).toEqual('docx');
    expect(utils.getFileExtension('mx_permit_{d.permitNumber}.docx')).toEqual('docx');
  });

  it('should return undefined if no extension', () => {
    expect(utils.getFileExtension('abc_123')).toEqual(undefined);
    expect(utils.getFileExtension('')).toEqual(undefined);
    expect(utils.getFileExtension('   ')).toEqual(undefined);
    expect(utils.getFileExtension(null)).toEqual(undefined);
    expect(utils.getFileExtension(undefined)).toEqual(undefined);
  });
});


describe('determinOutputReportName', () => {
  it('should return the specified output file name with the specified extension', () => {
    const template = {
      contentFileType: 'docx',
      outputFileType: 'pdf',
      outputFileName: 'abc_123_{d.firstname}-{d.lastname}',
    };
    expect(utils.determinOutputReportName(template)).toMatch('abc_123_{d.firstname}-{d.lastname}.pdf');
  });

  it('should return the specified output file name with the input extension if no output specified', () => {
    const template = {
      contentFileType: 'xlsx',
      outputFileName: 'abc_123_{d.firstname}-{d.lastname}',
    };
    expect(utils.determinOutputReportName(template)).toMatch('abc_123_{d.firstname}-{d.lastname}.xlsx');
  });

  it('should return random uuid as the output file name if none specified, with the specified extension', () => {
    const template = {
      contentFileType: 'odt',
      outputFileType: 'pdf'
    };
    expect(utils.determinOutputReportName(template)).toMatch(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}.pdf/);

  });

  it('should return random uuid as the output file name if none specified, with input extension if no output specified', () => {
    const template = {
      contentFileType: 'docx'
    };
    expect(utils.determinOutputReportName(template)).toMatch(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}.docx/);

  });
});
