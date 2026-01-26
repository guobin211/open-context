import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { HTMLWebBaseLoader } from '@langchain/community/document_loaders/web/html';
import { MozillaReadabilityTransformer } from '@langchain/community/document_transformers/mozilla_readability';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export class HtmlIndexer {
  async index() {}
}
